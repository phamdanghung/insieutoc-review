const GOOGLE_MAPS_REVIEW_LINK = "https://g.page/r/CY6ga0po0IeKEBM/review";
const FIREBASE_DB_URL = "https://insieutoc-review-default-rtdb.asia-southeast1.firebasedatabase.app";

// Danh sách gợi ý dự phòng (khi Firebase bảo trì hoặc mất kết nối)
const FALLBACK_REVIEWS = [
    { id: 'fb-1', review: "Dịch vụ in ấn rất nhanh và chuyên nghiệp, bản in sắc nét, màu sắc chuẩn đẹp. Nhân viên tư vấn nhiệt tình, giao hàng đúng hẹn!" },
    { id: 'fb-2', review: "In tem nhãn và decal tại In Siêu Tốc chất lượng cực kỳ ưng ý. Keo dính chắc, cắt bế chuẩn, giá thành rất hợp lý. Rất hài lòng!" },
    { id: 'fb-3', review: "Xưởng in uy tín, thời gian hoàn thành siêu tốc đúng như tên gọi. Chất lượng sản phẩm rất tốt, đóng gói cẩn thận. Đánh giá 5 sao!" },
    { id: 'fb-4', review: "Đội ngũ hỗ trợ chỉnh sửa file in rất có tâm và tỉ mỉ, in ra màu sắc rất tươi và rõ nét. Sẽ ủng hộ lâu dài!" },
    { id: 'fb-5', review: "Giá cả hợp lý, in nhanh lấy liền tiện lợi. Chất lượng bạt và decal sắc nét, độ bền cao. Rất đáng trải nghiệm!" },
    { id: 'fb-6', review: "Dịch vụ khách hàng tuyệt vời, nhân viên chu đáo, tư vấn rõ ràng. Tiến độ giao hàng luôn đúng hẹn cam kết." }
];

// Tính năng nhận diện trình duyệt Zalo
function isZaloBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return (ua.indexOf("Zalo") > -1);
}

// Hàm sao chép tương thích mọi trình duyệt di động
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (e) {
        console.warn('navigator.clipboard thất bại, dùng fallback textarea:', e);
    }

    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        console.error('Lỗi khi sao chép:', err);
        return false;
    }
}

// Kho dữ liệu lưu trong bộ nhớ tạm sau khi tải
let cachedReviews = [];

async function fetchSuggestions() {
    try {
        // Tải danh sách 1.855 câu chưa dùng từ reviews.json nội bộ
        const response = await fetch('./reviews.json');
        if (!response.ok) {
            throw new Error(`HTTP status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error('Dữ liệu reviews.json trống hoặc không hợp lệ');
        }

        cachedReviews = data;

        // Bốc ngẫu nhiên 3 câu
        const shuffled = [...cachedReviews].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);
        
        renderSuggestions(selected);
    } catch (error) {
        console.warn('Lỗi khi tải reviews.json nội bộ, chuyển sang gợi ý dự phòng:', error);
        renderFallbackSuggestions();
    }
}

function renderFallbackSuggestions() {
    const shuffled = [...FALLBACK_REVIEWS].sort(() => 0.5 - Math.random());
    renderSuggestions(shuffled.slice(0, 3));
}

function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestions-container');
    container.innerHTML = ''; 
    
    if (!suggestions || suggestions.length === 0) {
        container.innerHTML = '<p>Cảm ơn bạn đã ghé thăm In Siêu Tốc!</p>';
        return;
    }

    suggestions.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.innerText = item.review;
        btn.onclick = () => handleSuggestionClick(item.id, item.review);
        container.appendChild(btn);
    });
}

// Bấm vào câu có sẵn
async function handleSuggestionClick(id, text) {
    // 1. Copy vào bộ nhớ tạm
    await copyToClipboard(text);
    showToast();

    // 2. Ghi nhận lên Firebase trong nền (không làm trễ khách hàng)
    if (id && !String(id).startsWith('fb-')) {
        try {
            const matchedItem = cachedReviews.find(r => r.id === id) || { id, review: text };
            fetch(`${FIREBASE_DB_URL}/used/${id}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(matchedItem)
            }).catch(() => {});
        } catch (syncErr) {
            // Không chặn trải nghiệm khách
        }
    }

    // 3. Chuyển hướng tới Google Maps sau khi đã sao chép
    setTimeout(() => {
        window.location.href = GOOGLE_MAPS_REVIEW_LINK;
    }, 400);
}

// Bấm vào câu tự gõ
async function handleCustomSubmit() {
    const text = document.getElementById('custom-text').value.trim();
    if (!text) {
        alert("Vui lòng nhập nội dung đánh giá của bạn trước khi bấm nút.");
        return;
    }
    
    await copyToClipboard(text);
    showToast();
    setTimeout(() => {
        window.location.href = GOOGLE_MAPS_REVIEW_LINK;
    }, 400);
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
    // Nếu là Zalo, hiện cảnh báo ngay trên đầu trang
    if (isZaloBrowser()) {
        const container = document.querySelector('.container');
        const warning = document.createElement('div');
        warning.style.backgroundColor = '#d93025';
        warning.style.color = 'white';
        warning.style.padding = '15px';
        warning.style.borderRadius = '8px';
        warning.style.marginBottom = '20px';
        warning.style.textAlign = 'left';
        warning.innerHTML = `
            <strong style="font-size:16px;">⚠️ LƯU Ý QUAN TRỌNG:</strong><br/><br/>
            Bạn đang dùng trình duyệt Zalo. Zalo có thể sẽ <b>CHẶN</b> tính năng chuyển sang Google Maps.<br/><br/>
            👉 Để đánh giá thành công, vui lòng bấm vào nút <strong>[ ⋮ ]</strong> hoặc <strong>[ ... ]</strong> ở góc phải trên cùng màn hình -> chọn <strong>"Mở bằng trình duyệt"</strong> (Safari / Chrome / Internet).
        `;
        container.insertBefore(warning, container.firstChild);
    }
    
    // Gọi hàm tải dữ liệu
    fetchSuggestions();
});
