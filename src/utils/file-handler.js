import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const fsPromises = {
    writeFile: promisify(fs.writeFile),
    readFile: promisify(fs.readFile),
    mkdir: promisify(fs.mkdir),
    access: promisify(fs.access),
    readdir: promisify(fs.readdir),
    unlink: promisify(fs.unlink),
    stat: promisify(fs.stat)
};

const OUTPUT_DIR = path.join(process.cwd(), 'data', 'output');

// Ensure output directory exists on startup
(async () => {
    try {
        await fsPromises.mkdir(OUTPUT_DIR, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error('Failed to create output directory:', error);
        }
    }
})();

/**
 * Gets full file path in the output directory
 * @param {string} filename - Name of the file
 * @returns {string} Full file path
 */
function getOutputPath(filename) {
    if (!filename) throw new Error('Filename is required');
    const safeFilename = filename.replace(/[^a-z0-9\-_.]/gi, '_');
    return path.join(OUTPUT_DIR, safeFilename);
}

/**
 * Saves data to a file in the output directory
 * @param {string} filename - Name of the file
 * @param {any} data - Data to save
 * @param {Object} [options] - Options
 * @param {boolean} [options.json=true] - Whether to stringify as JSON
 * @returns {Promise<string>} - Full path where file was saved
 */
export async function saveToFile(filename, data, { json = true } = {}) {
    const filePath = getOutputPath(filename);
    const content = json ? JSON.stringify(data, null, 2) : data;
    await fsPromises.writeFile(filePath, content);
    return filePath;
}

/**
 * Reads data from a file in the output directory
 * @param {string} filename - Name of the file
 * @param {Object} [options] - Options
 * @param {boolean} [options.json=true] - Whether to parse as JSON
 * @returns {Promise<any>} - Parsed data or raw content
 */
export async function readFromFile(filename, { json = true } = {}) {
    const filePath = getOutputPath(filename);
    const content = await fsPromises.readFile(filePath, 'utf-8');
    return json ? JSON.parse(content) : content;
}

/**
 * Lists all files in the output directory
 * @returns {Promise<string[]>} - Array of file names
 */
export async function listFiles() {
    return await fsPromises.readdir(OUTPUT_DIR);
}

/**
 * Deletes a file from the output directory
 * @param {string} filename - Name of the file to delete
 * @returns {Promise<void>}
 */
export async function deleteFile(filename) {
    const filePath = getOutputPath(filename);
    try {
        await fsPromises.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw new Error(`Failed to delete file ${filename}: ${error.message}`);
        }
    }
}

/**
 * Gets file stats from the output directory
 * @param {string} filename - Name of the file
 * @returns {Promise<fs.Stats>} - File stats
 */
export async function getFileStats(filename) {
    const filePath = getOutputPath(filename);
    return await fsPromises.stat(filePath);
}

/**
 * Save the outerHTML of an element to a file
 * @param {import('puppeteer').ElementHandle} elementHandle 
 * @param {string} filePath - path to save file
 */
export async function saveElementHtml(elementHandle, filePath) {
    if (!elementHandle) {
      console.error("❌ No element provided to save HTML.");
      return;
    }
  
    try {
      const html = await elementHandle.evaluate(el => el.outerHTML);
      fs.writeFileSync(filePath, html, "utf-8");
      console.log(`✅ Saved element HTML to ${filePath}`);
    } catch (err) {
      console.error("❌ Error while saving element HTML:", err);
    }
  }