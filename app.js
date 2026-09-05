const GOOGLE_MAPS_REVIEW_LINK = "https://g.page/r/CY6ga0po0IeKEBM/review";
const FIREBASE_DB_URL = "https://insieutoc-review-default-rtdb.asia-southeast1.firebasedatabase.app";

async function fetchSuggestions() {
    try {
        const response = await fetch(`${FIREBASE_DB_URL}/available.json`);
        const data = await response.json();
        
        if (!data) {
            renderSuggestions([]);
            return;
        }

        // Chuyển object thành mảng và xáo trộn ngẫu nhiên
        const availableItems = Object.values(data);
        const shuffled = availableItems.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);
        
        renderSuggestions(selected);
    } catch (error) {
        console.error('Lỗi khi tải gợi ý:', error);
        document.getElementById('suggestions-container').innerHTML = '<p>Không thể tải dữ liệu.</p>';
    }
}

function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestions-container');
    container.innerHTML = ''; 
    
    if (suggestions.length === 0) {
        container.innerHTML = '<p>Hiện tại đã hết câu gợi ý. Cảm ơn bạn rất nhiều!</p>';
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
    try {
        await navigator.clipboard.writeText(text);
        
        // 1. Lấy thông tin câu hỏi hiện tại từ kho available
        const getRes = await fetch(`${FIREBASE_DB_URL}/available/${id}.json`);
        const item = await getRes.json();
        
        if (item) {
            // 2. Lưu sang kho used
            await fetch(`${FIREBASE_DB_URL}/used/${id}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            // 3. Xóa khỏi kho available
            await fetch(`${FIREBASE_DB_URL}/available/${id}.json`, {
                method: 'DELETE'
            });
        }
        
        showToast();
        setTimeout(() => { window.location.href = GOOGLE_MAPS_REVIEW_LINK; }, 2000);
    } catch (err) {
        alert('Có lỗi xảy ra, vui lòng thử lại.');
    }
}

// Bấm vào câu tự gõ
async function handleCustomSubmit() {
    const text = document.getElementById('custom-text').value.trim();
    if (!text) {
        alert("Vui lòng nhập nội dung đánh giá của bạn trước khi bấm nút.");
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        showToast();
        setTimeout(() => { window.location.href = GOOGLE_MAPS_REVIEW_LINK; }, 2000);
    } catch (err) {
        alert('Có lỗi xảy ra, không thể copy tự động. Vui lòng copy bằng tay.');
    }
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 2000);
}

document.addEventListener('DOMContentLoaded', fetchSuggestions);
