// ============================================
// PROTECTION: Disable Right Click & Developer Tools
// ============================================

// Disable Right Click
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
});

// Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
document.addEventListener('keydown', function (e) {
    // F12
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }

    // Ctrl+Shift+I (Inspector)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
    }

    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
    }

    // Ctrl+Shift+C (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
    }

    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
    }

    // Cmd+Option+I (Mac)
    if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        return false;
    }

    // Cmd+Option+J (Mac)
    if (e.metaKey && e.altKey && e.key === 'j') {
        e.preventDefault();
        return false;
    }

    // Cmd+Option+C (Mac)
    if (e.metaKey && e.altKey && e.key === 'c') {
        e.preventDefault();
        return false;
    }
});

// Detect DevTools
(function () {
    const detectDevTools = setInterval(function () {
        if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
            // Silently detect without alert
        }
    }, 1000);
})();

// Disable text selection (optional, but adds extra protection)
document.addEventListener('selectstart', function (e) {
    e.preventDefault();
});

// Disable copy
document.addEventListener('copy', function (e) {
    e.preventDefault();
});

// Clear console periodically
setInterval(function () {
    console.clear();
}, 1000);

// ============================================
// LOGIN FUNCTIONALITY
// ============================================

// Load credentials from config.json
async function loadCredentials() {
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        return config.setupCredentials;
    } catch (error) {
        console.error('Error loading credentials:', error);
        // Fallback credentials if file not found
        return {
            username: 'admin',
            password: 'admin123'
        };
    }
}

// Check if user is already logged in
function isLoggedIn() {
    return false; // Always return false to force login
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const credentials = await loadCredentials();

    if (username === credentials.username && password === credentials.password) {
        // Login successful
        // No session storage - force login every time page loads
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('setupContainer').style.display = 'block';
        document.getElementById('loginError').style.display = 'none';
    } else {
        // Login failed
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginPassword').value = '';
    }
}

// Initialize login on page load
function initializeLogin() {
    // Always show login container first
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('setupContainer').style.display = 'none';

    // Clear any existing session to be safe
    sessionStorage.removeItem('setupLoggedIn');

    // Add login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

// ============================================
// EXISTING SETUP FUNCTIONALITY
// ============================================

// Default configuration
const DEFAULT_CONFIG = {
    merchantName: 'SATE LOK-LOK KOREA',
    qrisStatic: '00020101021126650013ID.CO.BCA.WWW011893600014000205735802150008850020573580303UMI51440014ID.CO.QRIS.WWW0215ID10232795448530303UMI5204581453033605802ID5918SATE LOK LOK KOREA6006MALANG61056515362070703A0163047EA0',
    minTransaction: 1,
    serviceFee: {
        minAmount: 500000,
        percentage: 0.7
    }
};

// ============================================
// QRIS PARSER
// ============================================

// Parse QRIS string to extract merchant information
// QRIS follows EMV QR Code standard with Tag-Length-Value (TLV) format
// Tag "59" = Merchant Name
// Parse QRIS string to extract merchant information
// QRIS follows EMV QR Code standard with Tag-Length-Value (TLV) format
// Tag "59" = Merchant Name
function parseQRISString(qrisString) {
    try {
        if (!qrisString || qrisString.length < 10) {
            return null;
        }

        let index = 0;
        while (index < qrisString.length) {
            // Get Tag (2 digits)
            const tag = qrisString.substr(index, 2);
            index += 2;

            // Get Length (2 digits)
            const lengthStr = qrisString.substr(index, 2);
            const length = parseInt(lengthStr, 10);
            index += 2;

            // Validate length
            if (isNaN(length) || length < 0) {
                break;
            }

            // Get Value
            const value = qrisString.substr(index, length);
            index += length;

            // Check if this is the Merchant Name tag (59)
            if (tag === '59') {
                return {
                    merchantName: value
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Error parsing QRIS:', error);
        return null;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format number with thousand separator
function formatThousandSeparator(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Remove thousand separator and convert to number
function parseThousandSeparator(value) {
    return parseInt(value.replace(/\./g, ''), 10) || 0;
}

// Load configuration from localStorage
function loadConfig() {
    try {
        const stored = localStorage.getItem('qrisConfig');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading config:', e);
    }
    return DEFAULT_CONFIG;
}

// Save configuration to localStorage
function saveConfig(config) {
    try {
        localStorage.setItem('qrisConfig', JSON.stringify(config));
        return true;
    } catch (e) {
        console.error('Error saving config:', e);
        alert('Gagal menyimpan konfigurasi: ' + e.message);
        return false;
    }
}

// Populate form with current config
function populateForm() {
    const config = loadConfig();

    document.getElementById('qrisString').value = config.qrisStatic;
    document.getElementById('minTransaction').value = formatThousandSeparator(config.minTransaction);
    document.getElementById('serviceFeeMin').value = formatThousandSeparator(config.serviceFee.minAmount);
    document.getElementById('serviceFeePercent').value = config.serviceFee.percentage;

    // Parse and display merchant name from QRIS string
    if (config.qrisStatic) {
        const qrisData = parseQRISString(config.qrisStatic);
        if (qrisData && qrisData.merchantName) {
            document.getElementById('merchantNameValue').textContent = qrisData.merchantName;
            document.getElementById('merchantNameDetected').style.display = 'block';
        }
    }
}

// CRC16 Implementation for EMV QR
function crc16(text) {
    let crc = 0xFFFF;
    for (let i = 0; i < text.length; i++) {
        let c = text.charCodeAt(i);
        crc ^= c << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
            crc = crc & 0xFFFF;
        }
    }
    let hex = (crc & 0xFFFF).toString(16).toUpperCase();
    return hex.padStart(4, '0');
}

// Convert any QRIS string to Static QRIS (Remove Amount & Recalculate CRC)
function makeStaticQRIS(qrisString) {
    try {
        if (!qrisString || qrisString.length < 10) return qrisString;

        let index = 0;
        let newString = "";

        while (index < qrisString.length) {
            const tag = qrisString.substr(index, 2);
            const lengthStr = qrisString.substr(index + 2, 2);
            const length = parseInt(lengthStr, 10);

            if (isNaN(length)) break;

            const value = qrisString.substr(index + 4, length);

            // Modify Tag 01 (Point of Initiation Method) to '11' (Static)
            if (tag === '01') {
                newString += '010211';
            }
            // Skip Tag 54 (Amount), Tag 55 (Tip Indicator), Tag 63 (CRC)
            else if (tag !== '54' && tag !== '55' && tag !== '63') {
                newString += tag + lengthStr + value;
            }

            index += 4 + length;
        }

        // Add CRC Tag ID and Length
        newString += "6304";

        // Calculate CRC
        const crc = crc16(newString);

        return newString + crc;
    } catch (e) {
        console.error("Error converting to static QRIS", e);
        return qrisString; // Fallback
    }
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();

    try {
        // Get form values
        let qrisStatic = document.getElementById('qrisString').value.trim();

        // Ensure it is a valid static QRIS (Remove amount, force Tag 01=11, recalc CRC)
        qrisStatic = makeStaticQRIS(qrisStatic);

        const minTransaction = parseThousandSeparator(document.getElementById('minTransaction').value);
        const serviceFeeMin = parseThousandSeparator(document.getElementById('serviceFeeMin').value);
        const serviceFeePercent = parseFloat(document.getElementById('serviceFeePercent').value);

        // Validation
        if (!qrisStatic) {
            alert('Data QRIS statis harus diisi!');
            return;
        }

        // Parse merchant name from QRIS string
        const qrisData = parseQRISString(qrisStatic);
        if (!qrisData || !qrisData.merchantName) {
            alert('Gagal membaca merchant name dari QRIS string! Pastikan QRIS string valid.');
            return;
        }

        const merchantName = qrisData.merchantName;

        if (minTransaction < 1) {
            alert('Minimal transaksi harus >= 1');
            return;
        }

        if (serviceFeeMin < 0) {
            alert('Minimal nominal untuk biaya layanan tidak valid!');
            return;
        }

        if (serviceFeePercent < 0 || serviceFeePercent > 100) {
            alert('Persentase biaya layanan harus antara 0-100%');
            return;
        }

        // Create config object
        const config = {
            merchantName,
            qrisStatic,
            minTransaction,
            serviceFee: {
                minAmount: serviceFeeMin,
                percentage: serviceFeePercent
            }
        };

        // Save to localStorage
        if (saveConfig(config)) {
            alert('✅ Konfigurasi berhasil disimpan!\n\nSilakan kembali ke aplikasi untuk melihat perubahan.');
        }
    } catch (error) {
        console.error('Error in handleSubmit:', error);
        alert('Terjadi kesalahan sistem saat menyimpan: ' + error.message);
    }
}

// Reset to default configuration
function handleReset() {
    if (confirm('Yakin ingin reset ke konfigurasi default?')) {
        saveConfig(DEFAULT_CONFIG);
        populateForm();
        alert('✅ Konfigurasi berhasil direset ke default!');
    }
}

// Handle QR type radio change
function handleQRTypeChange() {
    const qrType = document.querySelector('input[name="qrType"]:checked').value;
    const qrStringGroup = document.getElementById('qrStringGroup');
    const qrImageGroup = document.getElementById('qrImageGroup');

    if (qrType === 'string') {
        qrStringGroup.style.display = 'block';
        qrImageGroup.style.display = 'none';
        document.getElementById('qrisString').required = true;
    } else {
        qrStringGroup.style.display = 'none';
        qrImageGroup.style.display = 'block';
        document.getElementById('qrisString').required = false;
    }
}

// Handle file upload
function handleFileUpload(file) {
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file terlalu besar! Maksimal 2MB');
        return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar!');
        return;
    }

    // Convert to base64 and decode QR
    const reader = new FileReader();
    reader.onload = function (e) {
        const base64 = e.target.result;

        // Show preview
        const previewImg = document.getElementById('previewImage');
        previewImg.src = base64;
        document.getElementById('uploadedImagePreview').style.display = 'block';

        // Decode QR code from image
        const img = new Image();
        img.onload = function () {
            // Create canvas to get image data
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Decode QR code using jsQR
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code && code.data) {
                // Successfully decoded QR code
                const qrisString = code.data;

                // Auto-fill the QRIS string textarea
                document.getElementById('qrisString').value = qrisString;

                // Parse merchant name and display it
                const qrisData = parseQRISString(qrisString);
                const merchantNameBox = document.getElementById('merchantNameDetected');
                const merchantNameValue = document.getElementById('merchantNameValue');

                if (qrisData && qrisData.merchantName) {
                    merchantNameValue.textContent = qrisData.merchantName;
                    merchantNameBox.style.display = 'block';
                    alert(`✅ QR Code berhasil dibaca!\n\n` +
                        `Merchant: ${qrisData.merchantName}\n` +
                        `QRIS string telah diisi secara otomatis.`);
                } else {
                    merchantNameBox.style.display = 'none';
                    alert('⚠️ QR Code berhasil dibaca, tetapi gagal mendeteksi merchant name.\n\n' +
                        'QRIS string telah diisi. Silakan periksa kembali.');
                }

                // Switch back to string input mode to show the result
                document.getElementById('qrTypeString').checked = true;
                handleQRTypeChange();
            } else {
                // Failed to decode QR code
                alert('❌ Gagal membaca QR Code dari gambar!\n\n' +
                    'Kemungkinan penyebab:\n' +
                    '- Gambar QR kurang jelas\n' +
                    '- Resolusi gambar terlalu rendah\n' +
                    '- Bukan gambar QR Code yang valid\n\n' +
                    'Silakan coba gambar lain atau paste string QRIS secara manual.');
            }
        };
        img.src = base64;
    };
    reader.readAsDataURL(file);
}

// Add thousand separator on input
function addThousandSeparatorInput(inputId) {
    const input = document.getElementById(inputId);
    input.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value) {
            e.target.value = formatThousandSeparator(value);
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Initialize login first
    initializeLogin();

    // Populate form with current config
    populateForm();

    // Form submit handler
    const setupForm = document.getElementById('setupForm');
    if (setupForm) {
        setupForm.addEventListener('submit', handleSubmit);
    }

    // Reset button handler
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleReset);
    }

    // QR type radio handlers
    document.querySelectorAll('input[name="qrType"]').forEach(radio => {
        radio.addEventListener('change', handleQRTypeChange);
    });

    // QRIS string input handler - parse merchant name in real-time
    const qrisStringInput = document.getElementById('qrisString');
    if (qrisStringInput) {
        qrisStringInput.addEventListener('input', function (e) {
            const qrisString = e.target.value.trim();
            const merchantNameBox = document.getElementById('merchantNameDetected');
            const merchantNameValue = document.getElementById('merchantNameValue');

            if (qrisString.length > 50) { // Only parse if string is long enough
                const qrisData = parseQRISString(qrisString);
                if (qrisData && qrisData.merchantName) {
                    merchantNameValue.textContent = qrisData.merchantName;
                    merchantNameBox.style.display = 'block';
                } else {
                    merchantNameBox.style.display = 'none';
                }
            } else {
                merchantNameBox.style.display = 'none';
            }
        });
    }

    // File upload handlers
    const fileInput = document.getElementById('qrImageFile');
    const uploadArea = document.getElementById('fileUploadArea');

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', function (e) {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });

        // Drag & drop handlers
        uploadArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            uploadArea.classList.add('active');
        });

        uploadArea.addEventListener('dragleave', function (e) {
            uploadArea.classList.remove('active');
        });

        uploadArea.addEventListener('drop', function (e) {
            e.preventDefault();
            uploadArea.classList.remove('active');
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });
    }

    // Add thousand separator to number inputs
    addThousandSeparatorInput('minTransaction');
    addThousandSeparatorInput('serviceFeeMin');
});
