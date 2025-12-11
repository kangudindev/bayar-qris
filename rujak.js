// ============================================
// QRIS PARSER
// ============================================

// Parse QRIS string to extract merchant information
// QRIS follows EMV QR Code standard with Tag-Length-Value (TLV) format
// Tag "59" = Merchant Name
function parseQRISString(qrisString) {
    try {
        if (!qrisString || qrisString.length < 10) {
            return null;
        }

        // Find tag "59" for merchant name
        const merchantNameTag = '59';
        let index = qrisString.indexOf(merchantNameTag);

        if (index === -1) {
            return null;
        }

        // Skip the tag (2 digits)
        index += 2;

        // Get length (2 digits)
        const length = parseInt(qrisString.substr(index, 2), 10);
        index += 2;

        // Get merchant name value
        const merchantName = qrisString.substr(index, length);

        return {
            merchantName: merchantName
        };
    } catch (error) {
        console.error('Error parsing QRIS:', error);
        return null;
    }
}

// ============================================
// GLOBAL VARIABLES
// ============================================

let currentQRData = null;
let debounceTimer = null;
let appConfig = null;

// Default configuration (fallback)
const DEFAULT_CONFIG = {
    merchantName: 'SATE LOK-LOK KOREA',
    qrisStatic: '00020101021126650013ID.CO.BCA.WWW011893600014000205735802150008850020573580303UMI51440014ID.CO.QRIS.WWW0215ID10232795448530303UMI5204581453033605802ID5918SATE LOK LOK KOREA6006MALANG61056515362070703A0163047EA0',
    minTransaction: 1,
    serviceFee: {
        minAmount: 500000,
        percentage: 0.7
    }
};

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

// Set QRIS utama saat page load
document.addEventListener('DOMContentLoaded', function () {
    // Load configuration
    appConfig = loadConfig();

    // Parse and set merchant name from QRIS string
    const qrisData = parseQRISString(appConfig.qrisStatic);
    if (qrisData && qrisData.merchantName) {
        document.getElementById('displayMerchantName').textContent = qrisData.merchantName;
    } else {
        // Fallback to default if parsing fails
        document.getElementById('displayMerchantName').textContent = 'Merchant';
    }

    // Update service fee message
    const serviceFeeTitle = document.getElementById('serviceFeeTitle');
    const serviceFeeDesc = document.getElementById('serviceFeeDesc');
    if (serviceFeeTitle && serviceFeeDesc) {
        serviceFeeTitle.textContent = `⚠️ Ada Biaya Layanan ${appConfig.serviceFee.percentage}%`;
        const formattedMin = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(appConfig.serviceFee.minAmount);
        serviceFeeDesc.textContent = `Pada transaksi QRIS di atas ${formattedMin}`;
    }

    // Update min transaction info
    const minTransactionAmount = document.getElementById('minTransactionAmount');
    if (minTransactionAmount) {
        const formattedMinTrx = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(appConfig.minTransaction);
        minTransactionAmount.textContent = formattedMinTrx;
    }

    // Store QRIS static to localStorage (for compatibility)
    localStorage.setItem('QRIS_Utama', appConfig.qrisStatic);

    // Generate QRIS statis pada awal load
    generateStaticQRIS(appConfig.qrisStatic);

    // Event listener untuk input nominal dengan thousand separator
    const nominalInput = document.getElementById('nominalInput');

    nominalInput.addEventListener('input', function (e) {
        // Format dengan separator ribuan
        let value = e.target.value.replace(/\D/g, ''); // Hapus semua non-digit

        if (value) {
            // Format dengan titik sebagai separator ribuan
            e.target.value = formatThousandSeparator(value);

            // Auto-generate QRIS dengan debounce (tunggu 800ms setelah user berhenti mengetik)
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const numericValue = Number(value);
                if (numericValue >= 1) {
                    generateQRIS(numericValue);
                }
            }, 800);
        } else {
            // Jika kosong, kembalikan ke QRIS statis
            generateStaticQRIS(qrisUtama);
        }
    });

    // ===== PROTEKSI: Disable Right Click & Developer Tools =====

    // Disable klik kanan (context menu)
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        return false;
    });

    // Disable text selection
    document.addEventListener('selectstart', function (e) {
        e.preventDefault();
        return false;
    });

    // Disable copy
    document.addEventListener('copy', function (e) {
        e.preventDefault();
        return false;
    });

    // Disable keyboard shortcuts untuk developer tools
    document.addEventListener('keydown', function (e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I (Inspect)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S (Save)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    });
});

// Format ke Rupiah
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Format angka dengan separator ribuan (titik)
function formatThousandSeparator(value) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Text-to-Speech untuk notifikasi suara
function speakText(text) {
    // Cek apakah browser support speech synthesis
    if ('speechSynthesis' in window) {
        // Cancel speech yang sedang berjalan jika ada
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID'; // Bahasa Indonesia
        utterance.rate = 0.9; // Sedikit lebih lambat untuk kejelasan
        utterance.pitch = 1;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    }
}

// Convert angka ke format rupiah untuk dibaca (tanpa simbol)
function formatNominalForSpeech(amount) {
    // Format: 50000 -> "lima puluh ribu"
    return new Intl.NumberFormat('id-ID').format(amount);
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

// Generate QRIS Statis (tanpa nominal)
async function generateStaticQRIS(qrisString) {
    try {
        // Ensure we are generating a truly static QRIS (no amount)
        const staticQRString = makeStaticQRIS(qrisString);
        currentQRData = staticQRString;

        // Sembunyikan amountDisplay untuk QRIS statis
        document.getElementById('amountDisplay').style.display = 'none';

        // Render QR statis
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, staticQRString, {
            width: 280,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'H'
        });

        document.getElementById('qrContainer').innerHTML = '';
        document.getElementById('qrContainer').appendChild(canvas);

        // Sembunyikan action buttons dan payment details untuk QRIS statis
        document.getElementById('actionButtons').style.display = 'none';
        document.getElementById('serviceFeeInfo').style.display = 'none';
        document.getElementById('paymentDetails').style.display = 'none';
        document.getElementById('minTransactionInfo').style.display = 'none';

        console.log('Static QR Generated');
    } catch (error) {
        console.error('Error generating static QR:', error);
    }
}

// Notifikasi
function showMessage(text, type = 'danger') {
    const alertClass = type === 'success' ? 'alert-success' :
        type === 'warning' ? 'alert-warning' : 'alert-danger';
    const messageHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.getElementById('messageContainer').innerHTML = messageHtml;
    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) alert.remove();
    }, 5000);
}

// Panggil API QRIS
async function qris(id, harga) {
    try {
        const response = await fetch(`https://api-mininxd.vercel.app/qris?qris=${id}&nominal=${harga}`);
        const data = await response.json();
        console.log("API Response:", data);
        return data;
    } catch (e) {
        return { error: e.message };
    }
}

// Generate QRIS Dinamis (dengan nominal)
async function generateQRIS(payAmount) {
    // Jika tidak ada parameter, ambil dari input
    if (!payAmount) {
        const nominalInput = document.getElementById('nominalInput');
        const inputValue = nominalInput.value.replace(/\D/g, ''); // Hapus separator
        payAmount = Number(inputValue);
    }

    // Validasi input
    if (!payAmount || payAmount < 1) {
        const qrisUtama = localStorage.getItem('QRIS_Utama');
        generateStaticQRIS(qrisUtama);
        return;
    }

    // Validasi minimal transaksi dari config
    if (payAmount < appConfig.minTransaction) {
        // Tampilkan warning minimal transaksi
        document.getElementById('minTransactionInfo').style.display = 'block';

        // Notifikasi suara untuk minimal transaksi
        const minText = formatNominalForSpeech(appConfig.minTransaction);
        speakText(`Mohon maaf, nominal pembayaran q-ris harus lebih dari ${minText} rupiah. Silakan masukkan nominal yang lebih besar. Terima kasih.`);

        return;
    } else {
        // Sembunyikan warning jika nominal sudah valid
        document.getElementById('minTransactionInfo').style.display = 'none';
    }

    const qrisUtama = localStorage.getItem('QRIS_Utama');

    try {
        // Cek apakah perlu biaya layanan - gunakan config dinamis
        const needServiceFee = payAmount >= appConfig.serviceFee.minAmount;
        const serviceFeeRate = appConfig.serviceFee.percentage / 100; // Convert percentage to decimal
        const serviceFee = needServiceFee ? Math.ceil(payAmount * serviceFeeRate) : 0;
        const totalAmount = payAmount + serviceFee;

        if (needServiceFee) {
            document.getElementById('serviceFeeInfo').style.display = 'block';

            // Populate payment details table
            document.getElementById('detailNominal').textContent = formatCurrency(payAmount);
            document.getElementById('detailServiceFee').textContent = formatCurrency(serviceFee);
            document.getElementById('detailTotal').textContent = formatCurrency(totalAmount);
            document.getElementById('paymentDetails').style.display = 'block';
        } else {
            document.getElementById('serviceFeeInfo').style.display = 'none';
            document.getElementById('paymentDetails').style.display = 'none';
        }

        // Generate QRIS dengan total amount (termasuk biaya layanan jika ada)
        const data = await qris(qrisUtama, totalAmount);

        if (!data || (!data.QR && !data.qr)) {
            throw new Error('Gagal generate QRIS dari API');
        }

        const qrString = data.QR || data.qr || data.qris;
        currentQRData = qrString;

        if (data.merchant) {
            document.getElementById('displayMerchantName').textContent = data.merchant;
        }

        // Render QR
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, qrString, {
            width: 280,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'H'
        });

        document.getElementById('qrContainer').innerHTML = '';
        document.getElementById('qrContainer').appendChild(canvas);
        document.getElementById('actionButtons').style.display = 'block';

        console.log('QR Generated successfully');

        // Notifikasi suara setelah QRIS berhasil di-generate
        const nominalText = formatNominalForSpeech(totalAmount);
        const merchantName = document.getElementById('displayMerchantName').textContent;
        let speechText = `Silakan melakukan pembayaran dengan q-ris sebesar: ${nominalText} rupiah. Terima kasih telah belanja di ${merchantName}.`;

        // Tambahkan notifikasi biaya layanan jika ada
        if (needServiceFee) {
            speechText += '. Pembayaran Anda sudah termasuk biaya layanan sebesar: nol koma tujuh persen';
        }

        speakText(speechText);
    } catch (error) {
        document.getElementById('qrContainer').innerHTML = `
            <div class="text-center text-danger">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>Gagal membuat QR Code</p>
                <small>${error.message}</small>
            </div>
        `;
        showMessage('Terjadi kesalahan: ' + error.message);
    }
}

// Download QR
function downloadQR() {
    const canvas = document.querySelector('#qrContainer canvas');
    if (canvas) {
        const payAmount = Number(document.getElementById('nominalInput').value);
        const merchant = document.getElementById('displayMerchantName').textContent || "Merchant";
        const link = document.createElement('a');
        link.download = `QRIS-${merchant}-${payAmount}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showMessage('QR Code berhasil didownload!', 'success');
    }
}

// Copy QR
function copyQRCode() {
    if (currentQRData) {
        navigator.clipboard.writeText(currentQRData)
            .then(() => showMessage('Kode QRIS berhasil disalin!', 'success'))
            .catch(() => showMessage('Gagal menyalin kode QRIS'));
    }
}

// Share QR
function shareQR() {
    const payAmount = Number(document.getElementById('nominalInput').value);
    if (navigator.share && currentQRData) {
        navigator.share({
            title: 'QRIS Payment',
            text: `Pembayaran ${formatCurrency(payAmount)} via QRIS`,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showMessage('Link pembayaran berhasil disalin!', 'success');
        });
    }
}
