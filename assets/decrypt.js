async function decryptAES(encryptedData, password) {
  const [ivBase64, saltBase64, encryptedContent] = encryptedData.split(':');
  const iv = base64ToArrayBuffer(ivBase64);
  const salt = base64ToArrayBuffer(saltBase64);
  const key = await deriveKey(password, salt);
  const algorithm = { name: 'AES-CBC', iv: iv };

  try {
    const decrypted = await crypto.subtle.decrypt(
      algorithm,
      key,
      base64ToArrayBuffer(encryptedContent)
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('解密失败，密码可能不正确');
  }
}

async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-CBC', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function decryptContent() {
  const password = document.getElementById('page-password').value;
  const encryptedContent = document.getElementById('encrypted-content').textContent;
  const loadingDiv = document.getElementById('loading');
  loadingDiv.style.display = 'block';
  
  try {
    const decryptedContent = await decryptAES(encryptedContent, password);
    const decryptedDiv = document.getElementById('decrypted-content');
    decryptedDiv.innerHTML = decryptedContent;
    
    // 添加淡入效果
    decryptedDiv.style.opacity = '0';
    decryptedDiv.style.display = 'block';
    document.getElementById('password-form').style.display = 'none';
    loadingDiv.style.display = 'none';
    
    setTimeout(() => {
      decryptedDiv.style.transition = 'opacity 0.5s ease-in-out';
      decryptedDiv.style.opacity = '1';
    }, 10);
    var elements = document.getElementsByClassName('aes-encrypted');
    if (elements.length > 0) {
        elements[0].style.display = 'none';
    }
  } catch (error) {
    alert('解密失败，请检查密码是否正确。');
    console.error('解密错误:', error);
    loadingDiv.style.display = 'none';
  }
}

// 在页面加载完成后检查是否需要显示密码输入框
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('encrypted-content')) {
    document.getElementById('password-form').style.display = 'block';
  }
});