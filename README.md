
---

# BatchCraft

> A Node.js CLI tool to intelligently group video files into time-based batches using FFmpeg.

BatchCraft automates the task of organizing `.mp4, .mkv` and other various format's video files into logical groups based on custom batch durations. Perfect for editors, content managers, or anyone working with large video archives.

---

## Features

* Natural sorting of video filenames (`1.mp4`, `2.mp4`, ..., `10.mp4`)
* Dynamic batch segmentation based on user-defined max hours
* FFmpeg-powered duration detection
* Generates batch summary to `batches.txt`
* Clean CLI interface with friendly prompts

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/X-RugvedCodes-X/BatchCraft.git
cd batchcraft
npm install
```

## Running the Tool

Use the development command:

```bash
npm run dev
```

