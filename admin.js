const FIREBASE_DB_URL = "https://insieutoc-review-default-rtdb.asia-southeast1.firebasedatabase.app";
let usedReviews = [];

let allReviews = [];

async function loadUsedReviews() {
    try {
        // Tải danh sách câu hỏi trong reviews.json dự phòng
        fetch('./reviews.json').then(r => r.json()).then(data => {
            allReviews = data || [];
        }).catch(() => {});

        const response = await fetch(`${FIREBASE_DB_URL}/used.json`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        if (data && !data.error && typeof data === 'object') {
            usedReviews = Object.values(data).filter(item => item && item.review);
        } else {
            usedReviews = [];
            if (data && data.error) {
                const noResult = document.getElementById('no-result');
                noResult.style.display = 'block';
                noResult.innerText = `⚠️ Lỗi phân quyền Firebase: "${data.error}". Vui lòng kiểm tra lại Rules trong Firebase Console.`;
                return;
            }
        }
        renderReviews(usedReviews);
    } catch (err) {
        console.error("Lỗi tải dữ liệu", err);
        const noResult = document.getElementById('no-result');
        noResult.style.display = 'block';
        noResult.innerText = "⚠️ Không thể kết nối tới Firebase (lỗi 401 hoặc mạng). Vui lòng kiểm tra Rules trên Firebase Console.";
    }
}

function renderReviews(list) {
    const container = document.getElementById('results-container');
    const noResult = document.getElementById('no-result');
    container.innerHTML = '';
    
    if (list.length === 0) {
        noResult.style.display = 'block';
        return;
    }
    noResult.style.display = 'none';

    // Đảo ngược danh sách để hiện câu mới nhất lên đầu
    [...list].reverse().forEach(item => {
        const card = document.createElement('div');
        card.className = 'review-card';
        
        card.innerHTML = `
            <div class="review-text"><strong>Khách đánh giá:</strong><br/>"${item.review}"</div>
            <div class="reply-text"><strong>Câu trả lời gợi ý:</strong><br/>${item.reply}</div>
            <div class="btn-group">
                <button class="btn btn-copy" onclick="copyReply('${item.id}', this)">📋 Copy Trả Lời</button>
                <button class="btn btn-done" onclick="markDone('${item.id}')">✅ Xóa (Đã trả lời xong)</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterReviews() {
    const text = document.getElementById('search').value.toLowerCase().trim();
    if (!text) {
        renderReviews(usedReviews);
        return;
    }
    
    // Ưu tiên tìm trong danh sách khách vừa chọn (used)
    let filtered = usedReviews.filter(item => item.review && item.review.toLowerCase().includes(text));
    
    // Nếu trong used không thấy, tìm tiếp trong kho tổng
    if (filtered.length === 0 && allReviews.length > 0) {
        filtered = allReviews.filter(item => item.review && item.review.toLowerCase().includes(text));
    }

    renderReviews(filtered);
}

async function copyReply(id, btnElement) {
    const item = usedReviews.find(x => x.id === id);
    if (item) {
        await navigator.clipboard.writeText(item.reply);
        
        const toast = document.getElementById('toast');
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2000);
        
        btnElement.innerText = "✓ Đã Copy";
        btnElement.style.backgroundColor = "#555";
    }
}

async function markDone(id) {
    if (confirm("Bạn có chắc là đã dán câu trả lời này lên Google Maps chưa? Ấn OK sẽ xóa nó khỏi hệ thống vĩnh viễn.")) {
        // Xóa khỏi Firebase
        await fetch(`${FIREBASE_DB_URL}/used/${id}.json`, {
            method: 'DELETE'
        });
        
        // Cập nhật lại giao diện
        usedReviews = usedReviews.filter(x => x.id !== id);
        filterReviews();
    }
}

document.addEventListener('DOMContentLoaded', loadUsedReviews);
