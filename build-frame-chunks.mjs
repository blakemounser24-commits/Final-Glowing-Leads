// Bundles frames/frame_0001.webp..frame_0241.webp into frames/chunks/chunk_NNN.bin
// (CHUNK_SIZE frames per file, each frame stored as [4-byte LE length][raw
// .webp bytes]). Run this any time frame content changes — see loadChunk()
// in index.html for the client-side reader, and bump CHUNK_ASSET_VERSION
// there afterward the same way FRAME_ASSET_VERSION used to be bumped.
//
// Why chunks at all: 241 individual ~134KB requests each pay fixed
// per-request overhead (TLS/connection, request/response round-trip)
// regardless of concurrency — that overhead, not bandwidth, was what made
// the preloader slow even on fast connections. Bundling into ~20 larger
// files cuts total requests ~11x while keeping every frame byte-for-byte
// identical to its original file.
import fs from "node:fs";
import path from "node:path";

const FRAMES_DIR = "frames";
const OUT_DIR = "frames/chunks";
const CHUNK_SIZE = 12;
const TOTAL_FRAMES = 241;

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = [];
for (let i = 1; i <= TOTAL_FRAMES; i++) {
  files.push("frame_" + String(i).padStart(4, "0") + ".webp");
}

let chunkIndex = 0;
for (let start = 0; start < files.length; start += CHUNK_SIZE) {
  const group = files.slice(start, start + CHUNK_SIZE);
  const buffers = [];
  for (const f of group) {
    const data = fs.readFileSync(path.join(FRAMES_DIR, f));
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32LE(data.length, 0);
    buffers.push(lenBuf, data);
  }
  const outName = "chunk_" + String(chunkIndex).padStart(3, "0") + ".bin";
  fs.writeFileSync(path.join(OUT_DIR, outName), Buffer.concat(buffers));
  chunkIndex++;
}

console.log("Wrote " + chunkIndex + " chunk files (" + CHUNK_SIZE + " frames each) to " + OUT_DIR);
