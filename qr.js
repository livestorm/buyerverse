/*!
 * qr.js — QR Code Model 2, byte mode, ECL-M, versions 1–10
 * Algorithm derived from Nayuki's "QR Code generator" (MIT licence)
 * https://www.nayuki.io/page/qr-code-generator-library
 * Adapted to a single dependency-free browser file by Livestorm, 2026.
 */
(function (global) {
  "use strict";

  // ---------------------------------------------------------------------------
  // GF(256) arithmetic (generator polynomial x^8 + x^4 + x^3 + x^2 + 1 = 0x11D)
  // ---------------------------------------------------------------------------
  var GF_EXP = new Uint8Array(512);
  var GF_LOG  = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (var i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  // Reed-Solomon: generate ECC for `data` using `nEcc` check symbols
  function rsEcc(data, nEcc) {
    // Generator polynomial coefficients
    var gen = [1];
    for (var i = 0; i < nEcc; i++) {
      // multiply gen by (x - alpha^i)
      var next = new Uint8Array(gen.length + 1);
      var ai = GF_EXP[i];
      for (var j = 0; j < gen.length; j++) {
        next[j]   ^= gen[j];
        next[j+1] ^= gfMul(gen[j], ai);
      }
      gen = next;
    }
    // gen is now degree nEcc; drop leading 1 → coefficients [1..nEcc]
    // Actually gen has length nEcc+1; we use indices 1..nEcc as divisor
    var rem = new Uint8Array(nEcc);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ rem[0];
      // shift rem left
      for (var j = 0; j < nEcc - 1; j++) rem[j] = rem[j+1] ^ gfMul(factor, gen[j+1]);
      rem[nEcc-1] = gfMul(factor, gen[nEcc]);
    }
    return rem;
  }

  // ---------------------------------------------------------------------------
  // QR version / capacity tables  (ECL = M = index 2 in [L,M,Q,H])
  // We only need byte-mode capacity and ECC parameters for versions 1–10, ECL M.
  //
  // Source: ISO 18004:2015, Annex I (character capacities) and Table 9 (ECC).
  //
  // Layout per entry:
  //   [dataBytes, eccBytesPerBlock, blocksGroup1, dataCodewordsGroup1,
  //                                 blocksGroup2, dataCodewordsGroup2]
  // (blocksGroup2=0 means only group1 exists)
  // ---------------------------------------------------------------------------
  // ECL M tables
  var ECL_M = 1; // index into [L,M,Q,H]

  // For each version 1-10, ECL M:
  // [totalDataBytes, eccPerBlock, g1Blocks, g1DataCW, g2Blocks, g2DataCW]
  // From ISO 18004 Table 9
  var VERSION_ECC = [
    null, // index 0 unused
    [16,  10, 1, 16, 0,  0], // v1
    [28,  16, 1, 28, 0,  0], // v2
    [44,  26, 1, 44, 0,  0], // v3  (NOTE: 44 total but 1 block of 34 data + 10 ecc — see below)
    [64,  18, 2, 32, 0,  0], // v4
    [86,  24, 2, 43, 0,  0], // v5
    [108, 16, 4, 27, 0,  0], // v6
    [124, 18, 4, 31, 0,  0], // v7
    [154, 22, 2, 38, 2, 39], // v8
    [182, 22, 3, 36, 2, 37], // v9
    [216, 26, 4, 43, 1, 44], // v10
  ];

  // Correct v3: 1 block, 44 data bytes total at M — but the standard says:
  // v3 M: 1 block, 26 ECC per block, total codewords=70, data codewords=44
  // That IS correct above. But wait: total codewords for v3 = 70, data = 44, ecc = 26.
  // The table entry [44, 26, 1, 44, 0, 0] means: totalData=44, eccPerBlock=26, 1 block of 44 data cw.
  // 44 + 26 = 70 total codewords. Correct.

  // Byte-mode capacity (max bytes that fit in the data codewords, accounting for
  // the 4-bit mode indicator + 8-bit char count indicator for versions 1-9):
  // dataBytes available = totalDataBytes - ceil((4 + 8 + data*8) / 8) overhead
  // Actually: overhead = 4 (mode) + 8 (length) bits = 12 bits = 1.5 bytes,
  // meaning max data length = floor((totalDataBytes * 8 - 4 - 8) / 8) = totalDataBytes - 2 (approx)
  // but we compute it precisely during encoding.

  // Max byte-mode capacity per version M (from ISO 18004 Table 7):
  var BYTE_CAPACITY_M = [0, 14, 26, 42, 62, 84, 106, 122, 152, 180, 213];

  // ---------------------------------------------------------------------------
  // Bit buffer
  // ---------------------------------------------------------------------------
  function BitBuffer() {
    this.bytes = [];
    this.bitLen = 0;
    this._cur = 0;
    this._curLen = 0;
  }
  BitBuffer.prototype.appendBits = function (val, numBits) {
    for (var i = numBits - 1; i >= 0; i--) {
      this._cur = (this._cur << 1) | ((val >>> i) & 1);
      this._curLen++;
      if (this._curLen === 8) {
        this.bytes.push(this._cur & 0xFF);
        this.bitLen += 8;
        this._cur = 0;
        this._curLen = 0;
      }
    }
  };
  BitBuffer.prototype.flush = function () {
    if (this._curLen > 0) {
      this.bytes.push((this._cur << (8 - this._curLen)) & 0xFF);
      this.bitLen += this._curLen;
      this._cur = 0;
      this._curLen = 0;
    }
  };

  // ---------------------------------------------------------------------------
  // Build the data codeword sequence for a given version + text (byte mode, ECL M)
  // Returns Uint8Array of length totalDataBytes
  // ---------------------------------------------------------------------------
  function buildDataCodewords(text, version) {
    var entry = VERSION_ECC[version];
    var totalData = entry[0];

    // UTF-8 encode
    var encoded = [];
    for (var i = 0; i < text.length; i++) {
      var cp = text.charCodeAt(i);
      if (cp < 0x80) {
        encoded.push(cp);
      } else if (cp < 0x800) {
        encoded.push(0xC0 | (cp >> 6));
        encoded.push(0x80 | (cp & 0x3F));
      } else if (cp < 0x10000) {
        encoded.push(0xE0 | (cp >> 12));
        encoded.push(0x80 | ((cp >> 6) & 0x3F));
        encoded.push(0x80 | (cp & 0x3F));
      } else {
        cp -= 0x10000;
        encoded.push(0xF0 | (cp >> 18));
        encoded.push(0x80 | ((cp >> 12) & 0x3F));
        encoded.push(0x80 | ((cp >> 6) & 0x3F));
        encoded.push(0x80 | (cp & 0x3F));
      }
    }

    var bb = new BitBuffer();
    // Mode indicator: byte = 0100
    bb.appendBits(0x4, 4);
    // Character count: 8 bits for versions 1-9, 16 bits for versions 10-26
    var ccBits = version <= 9 ? 8 : 16;
    bb.appendBits(encoded.length, ccBits);
    // Data bytes
    for (var i = 0; i < encoded.length; i++) bb.appendBits(encoded[i], 8);
    // Terminator (up to 4 zero bits)
    var totalBits = totalData * 8;
    var pad = Math.min(4, totalBits - bb.bitLen - bb._curLen);
    if (pad > 0) bb.appendBits(0, pad);
    // Pad to byte boundary
    if (bb._curLen > 0) bb.appendBits(0, 8 - bb._curLen);
    // Pad bytes (alternating 0xEC, 0x11)
    var padBytes = [0xEC, 0x11];
    var pi = 0;
    while (bb.bytes.length < totalData) {
      bb.bytes.push(padBytes[pi]);
      pi = (pi + 1) & 1;
    }

    return new Uint8Array(bb.bytes.slice(0, totalData));
  }

  // ---------------------------------------------------------------------------
  // Interleave data + ECC codewords
  // Returns flat Uint8Array of all codewords in symbol order
  // ---------------------------------------------------------------------------
  function interleave(data, version) {
    var entry = VERSION_ECC[version];
    // entry = [totalData, eccPerBlock, g1Blocks, g1DataCW, g2Blocks, g2DataCW]
    var eccPerBlock = entry[1];
    var g1Blocks    = entry[2];
    var g1DataCW    = entry[3];
    var g2Blocks    = entry[4];
    var g2DataCW    = entry[5];

    var blocks = [];
    var pos = 0;
    for (var i = 0; i < g1Blocks; i++) {
      var d = data.slice(pos, pos + g1DataCW);
      blocks.push({ data: d, ecc: rsEcc(d, eccPerBlock) });
      pos += g1DataCW;
    }
    for (var i = 0; i < g2Blocks; i++) {
      var d = data.slice(pos, pos + g2DataCW);
      blocks.push({ data: d, ecc: rsEcc(d, eccPerBlock) });
      pos += g2DataCW;
    }

    var result = [];
    // Interleave data
    var maxData = g2Blocks > 0 ? g2DataCW : g1DataCW;
    for (var col = 0; col < maxData; col++) {
      for (var b = 0; b < blocks.length; b++) {
        if (col < blocks[b].data.length) result.push(blocks[b].data[col]);
      }
    }
    // Interleave ECC
    for (var col = 0; col < eccPerBlock; col++) {
      for (var b = 0; b < blocks.length; b++) {
        result.push(blocks[b].ecc[col]);
      }
    }

    return new Uint8Array(result);
  }

  // ---------------------------------------------------------------------------
  // Module matrix builder
  // ---------------------------------------------------------------------------

  // Size of a version-v QR: 4*v + 17
  function matrixSize(v) { return 4 * v + 17; }

  // Alignment pattern center positions per version (ISO 18004 Annex E)
  var ALIGN_POS = [
    [],          // v1 (none)
    [6, 18],     // v2
    [6, 22],     // v3
    [6, 26],     // v4
    [6, 30],     // v5
    [6, 34],     // v6
    [6, 22, 38], // v7
    [6, 24, 42], // v8
    [6, 26, 46], // v9
    [6, 28, 50], // v10
  ];

  // Format information strings for ECL M, masks 0-7
  // Precomputed: 5-bit format data (ECL M=01, mask 3-bit) XOR'd with mask 101010000010010,
  // then BCH(15,5) error correction. We store the full 15-bit value per mask.
  // Formula: data bits = (ECL_M bits) << 3 | maskPattern
  // ECL M indicator = 00 (in format string: bits 13-12, note: NOT the BCH index)
  // Wait — the QR format info uses: ECL indicator bits for M = 00 (NOT 01!)
  // ISO 18004 Table 12: L=01, M=00, Q=11, H=10
  var FORMAT_INFO_MASK = 0b101010000010010; // 0x5412

  // BCH(15,5) generator: x^10 + x^8 + x^5 + x^4 + x^2 + x + 1 = 0x537
  function bchFormat(data) {
    var rem = data << 10;
    for (var i = 14; i >= 10; i--) {
      if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10);
    }
    return (data << 10) | rem;
  }

  // Precompute format words for ECL M (indicator 00), masks 0-7
  var FORMAT_WORDS = [];
  for (var mask = 0; mask < 8; mask++) {
    // 5-bit format data: bits 4-3 = ECL indicator (M=00), bits 2-0 = mask
    var formatData = (0b00 << 3) | mask; // ECL M = 00
    FORMAT_WORDS[mask] = bchFormat(formatData) ^ FORMAT_INFO_MASK;
  }

  // Place a finder pattern (7x7 with border) at top-left corner (row, col)
  function placeFinder(mat, row, col) {
    var n = mat.length;
    for (var r = -1; r <= 7; r++) {
      for (var c = -1; c <= 7; c++) {
        var mr = row + r, mc = col + c;
        if (mr < 0 || mr >= n || mc < 0 || mc >= n) continue;
        var inFinder = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        var onRing1  = r === 0 || r === 6 || c === 0 || c === 6;
        var inCore   = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        mat[mr][mc] = inFinder && (onRing1 || inCore) ? 1 : 0;
      }
    }
  }

  // Place alignment pattern (5x5) centered at (row, col)
  function placeAlign(mat, row, col) {
    for (var r = -2; r <= 2; r++) {
      for (var c = -2; c <= 2; c++) {
        var onEdge   = r === -2 || r === 2 || c === -2 || c === 2;
        var isCenter = r === 0 && c === 0;
        mat[row+r][col+c] = (onEdge || isCenter) ? 1 : 0;
      }
    }
  }

  // Mark a cell as "reserved" (function pattern — not data)
  // We use a separate boolean matrix for this
  function reserveCell(res, r, c) {
    var n = res.length;
    if (r >= 0 && r < n && c >= 0 && c < n) res[r][c] = true;
  }

  function placeFinderReserve(res, row, col) {
    var n = res.length;
    for (var r = -1; r <= 7; r++) {
      for (var c = -1; c <= 7; c++) {
        var mr = row + r, mc = col + c;
        if (mr >= 0 && mr < n && mc >= 0 && mc < n) res[mr][mc] = true;
      }
    }
  }

  function placeAlignReserve(res, row, col) {
    for (var r = -2; r <= 2; r++) {
      for (var c = -2; c <= 2; c++) res[row+r][col+c] = true;
    }
  }

  // Place timing patterns
  function placeTimingReserve(res, n) {
    for (var i = 0; i < n; i++) {
      res[6][i] = true;
      res[i][6] = true;
    }
  }
  function placeTiming(mat, n) {
    for (var i = 8; i < n - 8; i++) {
      var v = (i & 1) === 0 ? 1 : 0;
      mat[6][i] = v;
      mat[i][6] = v;
    }
  }

  // Place dark module
  function placeDarkModule(mat, v) {
    mat[4 * v + 9][8] = 1;
  }
  function reserveDarkModule(res, v) {
    res[4 * v + 9][8] = true;
  }

  // Version information (versions 7+): 18-bit word placed in two 6x3 blocks
  // BCH generator: x^12+x^11+x^10+x^9+x^8+x^5+x^2+1 = 0x1F25
  function bchVersion(version) {
    var rem = version << 12;
    for (var i = 17; i >= 12; i--) {
      if ((rem >>> i) & 1) rem ^= 0x1F25 << (i - 12);
    }
    return (version << 12) | rem;
  }

  // Reserve version info cells (6x3 top-right block + 3x6 bottom-left block)
  function reserveVersionInfo(res, version) {
    if (version < 7) return;
    var n = res.length;
    // Top-right block: rows 0-5, cols n-11 to n-9 (3 cols)
    for (var r = 0; r < 6; r++) for (var c = n - 11; c < n - 8; c++) res[r][c] = true;
    // Bottom-left block: rows n-11 to n-9 (3 rows), cols 0-5
    for (var r = n - 11; r < n - 8; r++) for (var c = 0; c < 6; c++) res[r][c] = true;
  }

  // Place version info bits into the matrix.
  // The 18-bit word is written so that jsQR's decoder reads the correct word.
  // jsQR top-right read order: outer y=5..0, inner x=(n-9)..(n-11), pushBit MSB-first.
  // So bit (17-i) of vw goes at (row=5-floor(i/3), col=n-9-i%3) for i=0..17.
  // Bottom-left is the row↔col transpose: row=n-9-i%3, col=5-floor(i/3).
  function placeVersionInfo(mat, version) {
    if (version < 7) return;
    var n = mat.length;
    var vw = bchVersion(version);
    for (var i = 0; i < 18; i++) {
      var bit = (vw >>> (17 - i)) & 1;
      // Top-right: row = 5-floor(i/3), col = n-9-i%3
      mat[5 - Math.floor(i / 3)][n - 9 - (i % 3)] = bit;
      // Bottom-left: transpose — row = n-9-i%3, col = 5-floor(i/3)
      mat[n - 9 - (i % 3)][5 - Math.floor(i / 3)] = bit;
    }
  }

  // Place format info (15 bits) into the two copies
  function placeFormatInfo(mat, formatWord) {
    var n = mat.length;
    // Copy 1: around top-left finder
    var bits = [];
    for (var i = 14; i >= 0; i--) bits.push((formatWord >>> i) & 1);
    // Position sequence: cols 0-5,7,8 (row 8) then rows 7-0 (col 8), skipping row 6 (timing)
    // Actually the standard sequence:
    // Positions (row, col) for copy 1 (top-left):
    var pos1 = [
      [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],
      [7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]
    ];
    for (var i = 0; i < 15; i++) mat[pos1[i][0]][pos1[i][1]] = bits[i];

    // Copy 2: top-right and bottom-left
    // Top-right (row 8, cols n-8 to n-1): bits 0..7
    for (var i = 0; i < 8; i++) mat[8][n - 1 - i] = bits[i]; // bits 14..7
    // Bottom-left (col 8, rows n-7 to n-1): bits 8..14
    for (var i = 0; i < 7; i++) mat[n - 7 + i][8] = bits[14 - i]; // bits 0..6
  }

  // Reserve format info cells
  function reserveFormatInfo(res) {
    var n = res.length;
    var pos1 = [
      [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],
      [7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]
    ];
    for (var i = 0; i < 15; i++) res[pos1[i][0]][pos1[i][1]] = true;
    for (var i = 0; i < 8; i++) res[8][n - 1 - i] = true;
    for (var i = 0; i < 7; i++) res[n - 7 + i][8] = true;
  }

  // Generate codeword placement order (zigzag columns, right to left, alternating up/down)
  function getDataModulePositions(n) {
    var positions = [];
    var right = n - 1;
    var goUp = true;
    while (right >= 1) {
      if (right === 6) { right--; continue; } // skip timing column
      var colRange = [right, right - 1];
      var rowRange = [];
      if (goUp) {
        for (var r = n - 1; r >= 0; r--) rowRange.push(r);
      } else {
        for (var r = 0; r < n; r++) rowRange.push(r);
      }
      for (var ri = 0; ri < rowRange.length; ri++) {
        for (var ci = 0; ci < colRange.length; ci++) {
          positions.push([rowRange[ri], colRange[ci]]);
        }
      }
      goUp = !goUp;
      right -= 2;
    }
    return positions;
  }

  // Mask patterns
  var MASK_FNS = [
    function(r,c){ return (r + c) % 2 === 0; },
    function(r,c){ return r % 2 === 0; },
    function(r,c){ return c % 3 === 0; },
    function(r,c){ return (r + c) % 3 === 0; },
    function(r,c){ return (Math.floor(r/2) + Math.floor(c/3)) % 2 === 0; },
    function(r,c){ return (r*c) % 2 + (r*c) % 3 === 0; },
    function(r,c){ return ((r*c) % 2 + (r*c) % 3) % 2 === 0; },
    function(r,c){ return ((r+c) % 2 + (r*c) % 3) % 2 === 0; },
  ];

  // Penalty scoring
  function penalty(mat) {
    var n = mat.length;
    var score = 0;

    // Rule 1: 5+ consecutive same-color in row or column
    function runPenalty(runs) {
      var s = 0;
      for (var i = 0; i < runs.length; i++) if (runs[i] >= 5) s += runs[i] - 2;
      return s;
    }
    for (var r = 0; r < n; r++) {
      var runs = []; var cur = mat[r][0]; var cnt = 1;
      for (var c = 1; c < n; c++) {
        if (mat[r][c] === cur) cnt++;
        else { runs.push(cnt); cur = mat[r][c]; cnt = 1; }
      }
      runs.push(cnt);
      score += runPenalty(runs);
    }
    for (var c = 0; c < n; c++) {
      var runs = []; var cur = mat[0][c]; var cnt = 1;
      for (var r = 1; r < n; r++) {
        if (mat[r][c] === cur) cnt++;
        else { runs.push(cnt); cur = mat[r][c]; cnt = 1; }
      }
      runs.push(cnt);
      score += runPenalty(runs);
    }

    // Rule 2: 2x2 blocks
    for (var r = 0; r < n - 1; r++) {
      for (var c = 0; c < n - 1; c++) {
        var v = mat[r][c];
        if (mat[r][c+1] === v && mat[r+1][c] === v && mat[r+1][c+1] === v) score += 3;
      }
    }

    // Rule 3: finder-like patterns
    var p1 = [1,0,1,1,1,0,1,0,0,0,0];
    var p2 = [0,0,0,0,1,0,1,1,1,0,1];
    for (var r = 0; r < n; r++) {
      for (var c = 0; c <= n - 11; c++) {
        var row = mat[r];
        var m1 = true, m2 = true;
        for (var k = 0; k < 11; k++) {
          if (row[c+k] !== p1[k]) m1 = false;
          if (row[c+k] !== p2[k]) m2 = false;
        }
        if (m1 || m2) score += 40;
      }
    }
    for (var c = 0; c < n; c++) {
      for (var r = 0; r <= n - 11; r++) {
        var m1 = true, m2 = true;
        for (var k = 0; k < 11; k++) {
          if (mat[r+k][c] !== p1[k]) m1 = false;
          if (mat[r+k][c] !== p2[k]) m2 = false;
        }
        if (m1 || m2) score += 40;
      }
    }

    // Rule 4: proportion of dark modules
    var dark = 0;
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) dark += mat[r][c];
    var pct = dark / (n * n) * 100;
    score += Math.abs(Math.floor(pct / 5) * 5 - 50) / 5 * 10 +
             Math.abs(Math.ceil(pct / 5) * 5 - 50) / 5 * 10;

    return score;
  }

  // ---------------------------------------------------------------------------
  // Main encode function — returns boolean[][] (true = dark)
  // ---------------------------------------------------------------------------
  function encode(text, ecl) {
    // ecl ignored for now — hardcoded M
    // Select version
    var version = -1;
    for (var v = 1; v <= 10; v++) {
      if (text.length <= BYTE_CAPACITY_M[v]) { version = v; break; }
    }
    if (version === -1) throw new Error("QR: text too long for versions 1-10 (M): " + text.length + " chars");

    var n = matrixSize(version);

    // Initialize matrices
    var mat = [];   // module values
    var res = [];   // reserved (function pattern) cells
    for (var r = 0; r < n; r++) {
      mat.push(new Uint8Array(n));
      res.push(new Uint8Array(n));
    }

    // Place finder patterns
    placeFinder(mat, 0, 0);   placeFinderReserve(res, 0, 0);
    placeFinder(mat, 0, n-7); placeFinderReserve(res, 0, n-7);
    placeFinder(mat, n-7, 0); placeFinderReserve(res, n-7, 0);

    // Place timing patterns
    placeTiming(mat, n);
    placeTimingReserve(res, n);

    // Alignment patterns (version >= 2)
    if (version >= 2) {
      var ap = ALIGN_POS[version - 1];
      for (var ai = 0; ai < ap.length; ai++) {
        for (var aj = 0; aj < ap.length; aj++) {
          var ar = ap[ai], ac = ap[aj];
          // Skip if overlaps with finder patterns
          var skip = false;
          if ((ar <= 8 && ac <= 8) ||
              (ar <= 8 && ac >= n - 9) ||
              (ar >= n - 9 && ac <= 8)) skip = true;
          if (!skip) {
            placeAlign(mat, ar, ac);
            placeAlignReserve(res, ar, ac);
          }
        }
      }
    }

    // Dark module
    placeDarkModule(mat, version);
    reserveDarkModule(res, version);

    // Version info (versions 7+): place now (static, not mask-dependent) and reserve
    if (version >= 7) {
      placeVersionInfo(mat, version);
      reserveVersionInfo(res, version);
    }

    // Reserve format info cells (we'll fill after mask selection)
    reserveFormatInfo(res);

    // Build and interleave codewords
    var dataBytes = buildDataCodewords(text, version);
    var codewords = interleave(dataBytes, version);

    // Get data module positions
    var positions = getDataModulePositions(n);

    // Place codewords into matrix (without mask first)
    var bitIdx = 0;
    var placedMod = [];
    for (var pi = 0; pi < positions.length; pi++) {
      var r = positions[pi][0], c = positions[pi][1];
      if (res[r][c]) continue;
      var cwIdx = bitIdx >> 3;
      var bitPos = 7 - (bitIdx & 7);
      var bit = cwIdx < codewords.length ? (codewords[cwIdx] >>> bitPos) & 1 : 0;
      mat[r][c] = bit;
      placedMod.push([r, c]);
      bitIdx++;
    }

    // Try all 8 masks, pick best penalty
    var bestMask = 0;
    var bestScore = Infinity;
    var bestMat = null;

    for (var mask = 0; mask < 8; mask++) {
      // Clone matrix
      var m2 = [];
      for (var r = 0; r < n; r++) m2.push(new Uint8Array(mat[r]));

      // Apply mask to data modules
      var mfn = MASK_FNS[mask];
      for (var pi = 0; pi < placedMod.length; pi++) {
        var r = placedMod[pi][0], c = placedMod[pi][1];
        if (mfn(r, c)) m2[r][c] ^= 1;
      }

      // Place format info
      placeFormatInfo(m2, FORMAT_WORDS[mask]);

      var sc = penalty(m2);
      if (sc < bestScore) {
        bestScore = sc;
        bestMask = mask;
        bestMat = m2;
      }
    }

    // Convert to boolean[][]
    var result = [];
    for (var r = 0; r < n; r++) {
      var row = [];
      for (var c = 0; c < n; c++) row.push(bestMat[r][c] === 1);
      result.push(row);
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  var QR = {
    /**
     * Returns the QR code as a boolean[][] (true = dark module).
     * opts.ecl defaults to 'M'.
     */
    matrix: function (text, opts) {
      return encode(text, (opts && opts.ecl) || 'M');
    },

    /**
     * Renders the QR code for `text` into `canvas`.
     * opts = { scale=4, margin=4, dark='#0f1f3d', light='#ffffff' }
     */
    toCanvas: function (text, canvas, opts) {
      opts = opts || {};
      var scale  = opts.scale  !== undefined ? opts.scale  : 4;
      var margin = opts.margin !== undefined ? opts.margin : 4;
      var dark   = opts.dark   !== undefined ? opts.dark   : '#0f1f3d';
      var light  = opts.light  !== undefined ? opts.light  : '#ffffff';

      var modules = encode(text, 'M');
      var size = modules.length;
      var total = (size + 2 * margin) * scale;

      canvas.width  = total;
      canvas.height = total;

      var ctx = canvas.getContext('2d');
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, total, total);
      ctx.fillStyle = dark;

      for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
          if (modules[r][c]) {
            ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
          }
        }
      }
    }
  };

  // Expose globally
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = QR;
  } else {
    global.QR = QR;
  }

})(typeof window !== 'undefined' ? window : this);
