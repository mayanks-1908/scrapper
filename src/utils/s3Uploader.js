// s3Upload.js
import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types'; // You'll need to install this: npm install mime-types
import { s3Client } from '../../config/s3Config.js'; // Import the centralized client

/**
 * Uploads a file to S3
 * @param {string} filePath - Path to the local file
 * @param {string} bucketName - S3 bucket name
 * @param {string} [key] - S3 object key (defaults to the filename)
 * @param {string} [acl] - Access control list (e.g., 'public-read', 'private')
 * @returns {Promise<{success: boolean, url?: string, key?: string, message?: string, error?: string}>}
 */
async function uploadFile(filePath, bucketName, key = null, acl = 'authenticated-read') {
    if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found.', key };
    }

    const fileStream = fs.createReadStream(filePath);
    const fileName = key || path.basename(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileStream,
        ContentType: contentType,
        // ACL: acl, // Set file permissions
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${encodeURIComponent(fileName)}`;

        return {
            success: true,
            url,
            key: fileName,
            message: 'File uploaded successfully'
        };
    } catch (error) {
        console.error('Error uploading to S3:', error);
        return {
            success: false,
            error: error.message,
            key: fileName
        };
    }
}

/**
 * Uploads a JSON object directly to S3
 * @param {Object} data - JSON data to upload
 * @param {string} bucketName - S3 bucket name
 * @param {string} key - S3 object key (including .json extension)
 * @param {string} [acl] - Access control list (e.g., 'public-read', 'private')
 * @returns {Promise<{success: boolean, url?: string, key?: string, message?: string, error?: string}>}
 */
async function uploadJson(data, bucketName, key, acl = 'authenticated-read') {
    const jsonKey = key.endsWith('.json') ? key : `${key}.json`;

    const params = {
        Bucket: bucketName,
        Key: jsonKey,
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json',
        // ACL: acl, // Set file permissions
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${encodeURIComponent(jsonKey)}`;

        return {
            success: true,
            url,
            key: jsonKey,
            message: 'JSON uploaded successfully'
        };
    } catch (error) {
        console.error('Error uploading JSON to S3:', error);
        return {
            success: false,
            error: error.message,
            key: jsonKey
        };
    }
}

export { uploadFile, uploadJson };