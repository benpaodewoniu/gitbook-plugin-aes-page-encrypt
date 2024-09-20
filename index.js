const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

module.exports = {
  website: {
    assets: './assets',
    js: [
      'decrypt.js'
    ]
  },
  hooks: {
    "page": function(page) {
      const config = this.config.get('pluginsConfig.aes-page-encrypt');
      const pagePassword = config.pages[page.path];

      if (!pagePassword) {
        return page;
      }

      const encryptedContent = encryptContent(page.content, pagePassword);
      
      page.content = `
        <style>
          .aes-encrypted {
            max-width: 400px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          #password-form {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          #page-password {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
          }
          #decrypt-button {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
          }
          #decrypt-button:hover {
            background-color: #45a049;
          }
          .encryption-notice {
            text-align: center;
            margin-bottom: 15px;
            color: #666;
            font-style: italic;
          }
          #loading {
            display: none;
            text-align: center;
            margin-top: 20px;
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <div class="aes-encrypted" style="text-align: center">
          <p class="encryption-notice">🔒 此页面内容已加密，请输入密码解锁</p>
          <div id="encrypted-content" style="display:none;">${encryptedContent}</div>
          <div id="password-form">
            <input type="password" id="page-password" placeholder="请输入密码" />
            <button id="decrypt-button" onclick="decryptContent()">解锁内容</button>
          </div>
          <div id="loading">
            <div class="spinner"></div>
            <p>正在解密内容，请稍候...</p>
          </div>
        </div>
        <div id="decrypted-content"></div>
      `;
      
      return page;
    }
  }
};

function encryptContent(content, password) {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(content, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return iv.toString('base64') + ':' + salt.toString('base64') + ':' + encrypted;
}