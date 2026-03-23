const canvas = document.getElementById("video-canvas");
const ctx = canvas.getContext("2d");

const frameCount = 35;
const images = [];
let imagesLoaded = 0;

function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
setCanvasSize();

const currentFrame = index => (
    `frames/ezgif-frame-${index.toString().padStart(3, '0')}.png`
);

// Preload all 35 images
for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    img.onload = () => {
        imagesLoaded++;
        if (i === 1) { 
            drawImage(img);
        }
    };
    images.push(img);
}

function drawImage(img) {
    if(!img || !img.complete || img.naturalWidth === 0) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate the ratio needed to 'cover' the whole canvas
    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasAspect > imgAspect) {
        // Canvas is wider than image (landscape)
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspect;
        // Center vertically
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
    } else {
        // Canvas is taller than image (portrait / mobile)
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgAspect;
        // Center horizontally
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
    }
    
    // Draw using the calculated 'cover' dimensions
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function updateFrame() {
    const scrollSection = document.getElementById("scroll-section");
    if (!scrollSection) return;
    
    // Handle COCO content fade out via isolated scroll wrapper
    const scrollFadeWrapper = document.querySelector('.scroll-fade-wrapper');
    if (scrollFadeWrapper) {
        const scrollY = window.scrollY;
        // Fades out completely by 50% of the viewport height
        const opacity = Math.max(0, 1 - (scrollY / (window.innerHeight * 0.5)));
        scrollFadeWrapper.style.opacity = opacity;
    }

    const rect = scrollSection.getBoundingClientRect();
    const sectionTop = rect.top;
    
    // Total height where scroll occurs
    const totalHeight = scrollSection.offsetHeight;
    
    // Intro section still visible
    if (sectionTop > 0) {
        if (images[0] && images[0].complete) drawImage(images[0]);
        
        // Ensure elements are hidden when scrolled all the way back to the intro
        document.getElementById('frame4-text')?.classList.remove('visible');
        document.getElementById('frame6-text')?.classList.remove('visible');
        document.getElementById('go-to-top')?.classList.remove('visible');
        
        const endButtons = document.getElementById('end-buttons');
        if (endButtons) {
            endButtons.style.transform = `translateY(0)`;
            endButtons.classList.remove('visible');
        }

        return;
    }

    // Playable range of sticky video
    const playableRange = totalHeight - window.innerHeight;
    const scrolledOffset = Math.abs(sectionTop);
    
    let fraction = scrolledOffset / playableRange;
    fraction = Math.max(0, Math.min(1, fraction));
    
    // The video ends before the actual scroll ends, leaving the rest of the scroll for the final buttons
    const videoEndFraction = 0.85; 
    let videoFraction = Math.min(1, fraction / videoEndFraction);
    
    const frameIndex = Math.floor(videoFraction * (frameCount - 1));
    
    // Toggle text block visibility at frame 4
    const frame4Text = document.getElementById('frame4-text');
    if (frame4Text) {
        if (frameIndex >= 4) {
            frame4Text.classList.add('visible');
        } else {
            frame4Text.classList.remove('visible');
        }
    }

    // Toggle text block visibility at frame 6
    const frame6Text = document.getElementById('frame6-text');
    if (frame6Text) {
        if (frameIndex >= 6) {
            frame6Text.classList.add('visible');
        } else {
            frame6Text.classList.remove('visible');
        }
    }
    
    // Toggle go-to-top button visibility at frame 10
    const goToTopBtn = document.getElementById('go-to-top');
    if (goToTopBtn) {
        if (frameIndex >= 10) {
            goToTopBtn.classList.add('visible');
        } else {
            goToTopBtn.classList.remove('visible');
        }
    }

    // Handle end-of-video buttons scrolling up
    const endButtons = document.getElementById('end-buttons');
    if (endButtons) {
        // Only start showing the buttons AFTER the video has finished its sequence
        if (fraction > videoEndFraction) {
            // Calculate how far past the threshold we are, from 0 to 1
            let progress = (fraction - videoEndFraction) / (1 - videoEndFraction);
            
            // Map progress to CSS transform: from 0 (starts at bottom: -20vh) up to -70vh (which puts it in the center)
            let moveUpAmount = progress * -70; 
            
            endButtons.style.transform = `translateY(${moveUpAmount}vh)`;
            endButtons.classList.add('visible');
        } else {
            endButtons.style.transform = `translateY(0)`;
            endButtons.classList.remove('visible');
        }
    }
    
    // Request animation frame for performance
    requestAnimationFrame(() => {
        if (images[frameIndex] && images[frameIndex].complete) {
            drawImage(images[frameIndex]);
        } else {
            // Fallback to nearest loaded frame
            let nearest = frameIndex;
            while (nearest >= 0 && (!images[nearest] || !images[nearest].complete)) {
                nearest--;
            }
            if (nearest >= 0) drawImage(images[nearest]);
        }
    });
}

// Handle Go To Top click
const goToTopBtn = document.getElementById('go-to-top');
if (goToTopBtn) {
    goToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'auto' // Immediate scroll as requested
        });
    });
}

// Handle Scroll Indicator click
const scrollIndicator = document.getElementById('scroll-indicator');
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const startY = window.scrollY;
        const scrollSection = document.getElementById("scroll-section");
        const endY = scrollSection ? scrollSection.offsetHeight : document.body.scrollHeight;
        const distance = endY - startY;
        const duration = 2500; // 2.5 seconds for a slow, smooth scroll
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            let progress = timeElapsed / duration;
            if (progress > 1) progress = 1;
            
            // Ease-in-out cubic function for a very smooth start and end
            const easeProgress = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            window.scrollTo(0, startY + (distance * easeProgress));

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    });
}

// Handle window properties changing
window.addEventListener('resize', () => {
    setCanvasSize();
    updateFrame();
});
window.addEventListener('scroll', updateFrame, { passive: true });

// Fallback logic to ensure first draw executes if needed
setTimeout(updateFrame, 500);

// --- Browse Page Logic ---
const browseBtn = document.getElementById('browse-btn');
const backToHome = document.getElementById('back-to-home');
const searchWrapper = document.getElementById('search-wrapper');
const searchInput = document.getElementById('search-input');
const searchIcon = document.getElementById('search-icon');

if (browseBtn) {
    browseBtn.addEventListener('click', () => {
        // Scroll to top first to ensure a smooth transition
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Delay slightly for scroll before sliding
        setTimeout(() => {
            document.body.classList.add('browse-active');
        }, 150);
    });
}

if (backToHome) {
    backToHome.addEventListener('click', () => {
        document.body.classList.remove('browse-active');
    });
}



if (searchWrapper) {
    // When clicking anywhere on the wrapper, expand it and focus input
    searchWrapper.addEventListener('click', (e) => {
        if (!searchWrapper.classList.contains('expanded')) {
            searchWrapper.classList.add('expanded');
            searchInput.focus();
            e.stopPropagation(); // prevent immediate closing
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (searchWrapper.classList.contains('expanded') && !searchWrapper.contains(e.target) && searchInput.value.trim() === '') {
            searchWrapper.classList.remove('expanded');
        }
    });

    // Handle search icon click if we want to submit or focus
    searchIcon.addEventListener('click', (e) => {
        if (searchWrapper.classList.contains('expanded')) {
            e.stopPropagation(); // Prevent toggling logic from wrapper
            if (searchInput.value.trim() !== '') {
                // Perform search
                console.log("Searching for:", searchInput.value);
            } else {
                searchInput.focus();
            }
        }
    });

    // --- Browse Page Search Logic ---
    const searchClose = document.getElementById('search-close');
    const productGrid = document.querySelector('.product-grid');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            searchBrowse(query);
        });

        // Add Enter key support
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchInput.blur();
            }
        });
    }

    function searchBrowse(query) {
        const panels = document.querySelectorAll('.product-panel');
        let hasResults = false;
        
        panels.forEach(panel => {
            const name = panel.querySelector('.product-name').innerText.toLowerCase();
            if (name.includes(query)) {
                panel.style.display = 'flex';
                hasResults = true;
            } else {
                panel.style.display = 'none';
            }
        });

        // Handle no results message
        let existingNoRes = productGrid.querySelector('.no-products');
        if (!hasResults && query !== '') {
            if (!existingNoRes) {
                const noRes = document.createElement('div');
                noRes.className = 'no-products';
                noRes.innerText = 'No matching treats found...';
                productGrid.appendChild(noRes);
            }
        } else {
            if (existingNoRes) {
                existingNoRes.remove();
            }
        }
    }

    if (searchClose) {
        searchClose.addEventListener('click', (e) => {
            e.stopPropagation();
            searchInput.value = '';
            searchBrowse('');
            searchWrapper.classList.remove('expanded');
        });
    }
}

// --- FAQ Page Logic ---
const faqBtn = document.getElementById('faq-btn');
const faqPage = document.getElementById('faq-page');
const faqBackToHome = document.getElementById('faq-back-to-home');
const faqSearchWrapper = document.getElementById('faq-search-wrapper');
const faqSearchInput = document.getElementById('faq-search-input');
const faqSearchIcon = document.getElementById('faq-search-icon');
const faqContainer = document.getElementById('faq-container');

// FAQ Data from FAQ.txt (Hardcoded for simplicity or parsed if needed)
const faqData = [
    {
        category: "General Questions",
        items: [
            { q: "What types of chocolates do you offer?", a: "All the chocolates listed on the website are offered for purchase. A custom flavor can be requested through the 'customize an order' page. Each flavor can further be customized when placing an order, charges may differ which will be clarified at the time of placing the order." },
            { q: "Are your chocolates handmade or mass-produced?", a: "Home made, as per demand." },
            { q: "What makes your chocolates different from others?", a: "Only locally sourced ingredients are used, no preservatives, no artificial colors, no chemicals, no artificial flavoring like in most mass produced chocolates." },
            { q: "Are your chocolates safe in hot weather?", a: "Keep the chocolates in the refrigerator for 10 - 15 minutes, after which you can store them at a cool place at room temperature." },
            { q: "Do you guarantee freshness?", a: "Yes! We take pride in having all orders made fresh upon request." }
        ]
    },
    {
        category: "Shipping & Delivery",
        items: [
            { q: "How long does delivery take?", a: "The delivery can take 2 days from the time of ordering, the delivery will be made between 7 AM to 6 PM IST." },
            { q: "Do you deliver across India / internationally?", a: "Delivery is available only in Nadiad or Anand." },
            { q: "What are the shipping charges?", a: "Rs. 30 is the standard delivery charge for an order above Rs. 1,500, shipping is free." },
            { q: "Can I choose a delivery date?", a: "Yes, but the delivery date must at least be 2 days from the day you place your order on." }
        ]
    },
    {
        category: "Orders & Payments",
        items: [
            { q: "What payment methods do you accept?", a: "At the moment only UPI payments are accepted." },
            { q: "Is Cash On Delivery (COD) available?", a: "No, to prevent any cases where the delivery is not accepted, the chocolates go to waste as each order is prepared fresh." }
        ]
    },
    {
        category: "Gifting & Special Occasions",
        items: [
            { q: "Do you offer gift wrapping?", a: "It can be requested, charges may apply for special handling." },
            { q: "Do you offer bulk discounts?", a: "Enquiries for pricing can be made through the 'customize an order' page." }
        ]
    },
    {
        category: "Returns & Support",
        items: [
            { q: "What is your return or refund policy?", a: "For such edible products, there is no option for a return or refund. Please be sure to place the correct order as in case of a cancellation, the produced chocolates go to waste." }
        ]
    }
];

if (faqBtn) {
    faqBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            document.body.classList.add('faq-active');
            renderFAQs();
        }, 150);
    });
}

if (faqBackToHome) {
    faqBackToHome.addEventListener('click', () => {
        document.body.classList.remove('faq-active');
    });
}



// Reuse search-like wrapper behavior
if (faqSearchWrapper) {
    faqSearchWrapper.addEventListener('click', (e) => {
        if (!faqSearchWrapper.classList.contains('expanded')) {
            faqSearchWrapper.classList.add('expanded');
            faqSearchInput.focus();
            e.stopPropagation();
        }
    });

    document.addEventListener('click', (e) => {
        if (faqSearchWrapper.classList.contains('expanded') && !faqSearchWrapper.contains(e.target) && faqSearchInput.value.trim() === '') {
            faqSearchWrapper.classList.remove('expanded');
        }
    });

    faqSearchInput.addEventListener('input', () => {
        const query = faqSearchInput.value.toLowerCase().trim();
        if (query) {
            searchFAQs(query);
        } else {
            renderFAQs();
        }
    });

    const faqSearchClose = document.getElementById('faq-search-close');
    if (faqSearchClose) {
        faqSearchClose.addEventListener('click', (e) => {
            e.stopPropagation();
            faqSearchInput.value = '';
            renderFAQs(); // Reset to category view
            faqSearchWrapper.classList.remove('expanded');
        });
    }
}

function renderFAQs() {
    faqContainer.innerHTML = '';
    faqContainer.classList.remove('faq-search-results');
    
    faqData.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'faq-category-section';
        
        const title = document.createElement('h2');
        title.className = 'faq-category-title';
        title.innerText = cat.category;
        title.onclick = () => section.classList.toggle('open');
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'faq-items-container';
        
        cat.items.forEach(item => {
            itemsContainer.appendChild(createFAQItem(item));
        });
        
        section.appendChild(title);
        section.appendChild(itemsContainer);
        faqContainer.appendChild(section);
    });
}

function createFAQItem(item) {
    const itemEl = document.createElement('div');
    itemEl.className = 'faq-item';
    
    const question = document.createElement('div');
    question.className = 'faq-question';
    question.innerText = item.q;
    question.onclick = () => itemEl.classList.toggle('open');
    
    const answer = document.createElement('div');
    answer.className = 'faq-answer';
    answer.innerText = item.a;
    
    itemEl.appendChild(question);
    itemEl.appendChild(answer);
    return itemEl;
}

function searchFAQs(query) {
    faqContainer.innerHTML = '';
    faqContainer.classList.add('faq-search-results');
    
    const results = [];
    faqData.forEach(cat => {
        cat.items.forEach(item => {
            if (item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)) {
                results.push(item);
            }
        });
    });
    
    if (results.length > 0) {
        results.forEach(item => {
            const el = createFAQItem(item);
            el.classList.add('open'); // Open by default in search results
            faqContainer.appendChild(el);
        });
    } else {
        const noRes = document.createElement('div');
        noRes.className = 'no-results';
        noRes.innerText = 'No matching questions found...';
        faqContainer.appendChild(noRes);
    }
}

// --- Policies Page Logic ---
const policiesBtn = document.getElementById('policies-btn');
const policiesPage = document.getElementById('policies-page');
const policiesBackToHome = document.getElementById('policies-back-to-home');
const policiesContainer = document.getElementById('policies-container');

const policiesData = [
    {
        title: "Shipping Policy",
        points: [
            "Any order is prepared when the order is placed and shipped out for delivery in 2 days.",
            "A minimum order of Rs. 250 must be made to qualify for shipping.",
            "No extra charges for packaging.",
            "Deliveries will be made between 7 AM to 6 PM IST."
        ]
    },
    {
        title: "Return & Refund Policy",
        points: [
            "Due to the perishable nature of chocolates, returns are not accepted.",
            "Orders cannot be refunded, an exception can only be made in case of receiving an incorrect order, a refund will be issued in that case or a correct order will be sent as per the customers request."
        ]
    },
    {
        title: "Cancellation Policy",
        points: [
            "A 50% of the order value is to be paid in advance.",
            "If an order is cancelled within 2 hours of placing it, a full refund will be issued of the advance payment."
        ]
    },
    {
        title: "Product Disclaimer",
        points: [
            "To ensure that the chocolates do not contain any allergens, please confirm the type of chocolates being ordered before confirming the order.",
            "Prices and product availability are subject to change without prior notice. Orders already placed, shall not be affected with any changes.",
            "We reserve the right to refuse or cancel any order if necessary."
        ]
    }
];

if (policiesBtn) {
    policiesBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            document.body.classList.add('policies-active');
            renderPolicies();
        }, 150);
    });
}

if (policiesBackToHome) {
    policiesBackToHome.addEventListener('click', () => {
        document.body.classList.remove('policies-active');
    });
}



function renderPolicies() {
    policiesContainer.innerHTML = '';
    
    policiesData.forEach(policy => {
        const section = document.createElement('div');
        section.className = 'policy-section';
        
        const title = document.createElement('h2');
        title.className = 'policy-title';
        title.innerText = policy.title;
        
        const list = document.createElement('ul');
        list.className = 'policy-list';
        
        policy.points.forEach(point => {
            const li = document.createElement('li');
            li.innerText = point;
            list.appendChild(li);
        });
        
        section.appendChild(title);
        section.appendChild(list);
        policiesContainer.appendChild(section);
    });
}

// --- Product Details & Carousel Logic ---
const productGallery = {
    "dinosaurs": ['dino1.png', 'dino2.png', 'dino3.png', 'dino4.png'],
    "christmas": ['gingerman.png', 'snowflake.png', 'tree.png'],
    "bite sized": ['classics1.png', 'classics2.png', 'classics3.png'],
    "what is love?": ['heart.png'],
    "geometric": ['shape1.png', 'shape2.png', 'shape3.png'],
    "classic cuties": ['bar.png', 'bear.png', 'car.png', 'horse.png'],
    "gifts? for me?": ['star.png', 'gift.png', 'rose.png'],
    "flower frenzy": ['flower.png', 'flower1.png', 'rose.png'],
    "roses are red chocolate": ['rose.png'],
    "animals": ['chicken.png', 'dog.png', 'pig.png']
};

const detailsPage = document.getElementById('product-details-page');
const detailsBackBtn = document.getElementById('details-back-btn');
const productPanels = document.querySelectorAll('.product-panel');

const detailTitle = document.getElementById('detail-title');
const sliderLeft = document.getElementById('slider-left');
const sliderRight = document.getElementById('slider-right');

const cards = [
    document.getElementById('card-0'),
    document.getElementById('card-1'),
    document.getElementById('card-2')
];
const imgs = [
    document.getElementById('img-0'),
    document.getElementById('img-1'),
    document.getElementById('img-2')
];

const flavorBtns = document.querySelectorAll('.flavor-btn');
const sizeBtns = document.querySelectorAll('.size-btn');

// Price lookup: flavor keyword -> [250gm, 500gm, 1kg]
const pricingMap = [
    { keywords: ['dark chocolate'],                    prices: [225, 450, 850] },
    { keywords: ['white chocolate'],                   prices: [200, 400, 750] },
    { keywords: ['milk chocolate'],                    prices: [200, 400, 750] },
    { keywords: ['peanut'],                            prices: [225, 450, 850] },
    { keywords: ['roasted almond', 'mixed nuts', 'hazelnut'], prices: [300, 600, 1150] },
    { keywords: ['oreo', 'caramel'],                   prices: [250, 500, 950] },
];

const sizeIndexMap = { '250 gm': 0, '500 gm': 1, '1 kg': 2 };

function getPrice(flavorText, sizeText) {
    const fl = flavorText.toLowerCase().trim();
    for (const entry of pricingMap) {
        if (entry.keywords.some(k => fl.includes(k))) {
            const idx = sizeIndexMap[sizeText.trim()];
            if (idx !== undefined) return entry.prices[idx];
        }
    }
    return null;
}

function updatePlaceOrderBtn() {
    const btn = document.getElementById('place-order-btn');
    if (!btn) return;
    const span = btn.querySelector('span');
    if (!span) return;

    const selectedFlavor = document.querySelector('.flavor-btn.selected');
    const selectedSize   = document.querySelector('.size-btn.selected');

    if (selectedFlavor && selectedSize) {
        const price = getPrice(selectedFlavor.innerText, selectedSize.innerText);
        if (price !== null) {
            span.textContent = `Place order Amount Rs. ${price}`;
            return;
        }
    }
    span.textContent = 'Place order';
}

let currentGallery = [];
let currentIndex = 0;
let carouselInterval = null;
let cardStates = ['left-card', 'main-card', 'right-card'];

function clearCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

function applyCardStates() {
    for (let i = 0; i < 3; i++) {
        if (cards[i]) {
            cards[i].className = 'carousel-card ' + cardStates[i];
        }
    }
}

function updateMainImage() {
    let n = currentGallery.length;
    if (n === 0) return;
    
    // reset states tightly matching indices
    cardStates = ['left-card', 'main-card', 'right-card'];
    cards.forEach(c => {
        if (c) c.style.display = 'flex';
    });
    
    if (n === 1) {
        if (imgs[1]) imgs[1].src = 'chocolates/' + currentGallery[0];
        
        if (cards[0]) {
            cards[0].style.opacity = '0';
            cards[0].style.pointerEvents = 'none';
        }
        if (cards[2]) {
            cards[2].style.opacity = '0';
            cards[2].style.pointerEvents = 'none';
        }
    } else {
        if (cards[0]) {
            cards[0].style.opacity = '';
            cards[0].style.pointerEvents = '';
        }
        if (cards[2]) {
            cards[2].style.opacity = '';
            cards[2].style.pointerEvents = '';
        }
        
        let prevIdx = (currentIndex - 1 + n) % n;
        let nextIdx = (currentIndex + 1) % n;
        
        if (imgs[0]) imgs[0].src = 'chocolates/' + currentGallery[prevIdx];
        if (imgs[1]) imgs[1].src = 'chocolates/' + currentGallery[currentIndex];
        if (imgs[2]) imgs[2].src = 'chocolates/' + currentGallery[nextIdx];
    }
    applyCardStates();
}

function nextImage() {
    let n = currentGallery.length;
    if (n > 1) {
        currentIndex = (currentIndex + 1) % n;
        // Shift right
        cardStates.unshift(cardStates.pop());
        applyCardStates();
        
        let newRightIdx = cardStates.indexOf('right-card');
        let nextDataIdx = (currentIndex + 1) % n;
        
        setTimeout(() => {
            if (imgs[newRightIdx]) imgs[newRightIdx].src = 'chocolates/' + currentGallery[nextDataIdx];
        }, 150);
    }
}

function prevImage() {
    let n = currentGallery.length;
    if (n > 1) {
        currentIndex = (currentIndex - 1 + n) % n;
        // Shift left
        cardStates.push(cardStates.shift());
        applyCardStates();
        
        let newLeftIdx = cardStates.indexOf('left-card');
        let prevDataIdx = (currentIndex - 1 + n) % n;
        
        setTimeout(() => {
            if (imgs[newLeftIdx]) imgs[newLeftIdx].src = 'chocolates/' + currentGallery[prevDataIdx];
        }, 150);
    }
}

function startCarousel() {
    clearCarousel();
    if (currentGallery.length > 1) {
        carouselInterval = setInterval(nextImage, 3000);
    }
}

// --- Customize Page Logic ---
const customizeBtn = document.getElementById('customize-btn');
const customizeBackBtn = document.getElementById('customize-back-btn');
const cocoOptionBtns = document.querySelectorAll('.coco-option-btn');
const submitCustomOrderBtn = document.getElementById('submit-custom-order-btn');
const customOrderText = document.getElementById('custom-order-text');

if (customizeBtn) {
    customizeBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            document.body.classList.add('customize-active');
        }, 150);
    });
}

if (customizeBackBtn) {
    customizeBackBtn.addEventListener('click', () => {
        document.body.classList.remove('customize-active');
    });
}



cocoOptionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('selected');
    });
});

const WHATSAPP_NUMBER = '918200354871';

function redirectToWhatsApp(message) {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(url, '_blank');
}

if (submitCustomOrderBtn) {
    submitCustomOrderBtn.addEventListener('click', () => {
        const selectedCocos = Array.from(document.querySelectorAll('.coco-option-btn.selected')).map(b => b.innerText);
        const description = customOrderText.value.trim();
        
        if (selectedCocos.length === 0) {
            alert('Please select at least one Coco option.');
            return;
        }
        if (!description) {
            alert('Please describe your order.');
            return;
        }
        
        const message = `Order Request:\n- Cocos: ${selectedCocos.join(', ')}\n- Description: ${description}`;
        redirectToWhatsApp(message);
        
        // Reset form
        customOrderText.value = '';
        cocoOptionBtns.forEach(b => b.classList.remove('selected'));
        document.body.classList.remove('customize-active');
    });
}

productPanels.forEach(panel => {
    panel.addEventListener('click', () => {
        const titleEl = panel.querySelector('.product-name');
        let title = titleEl.innerText.trim();
        
        detailTitle.innerHTML = titleEl.innerHTML;
        
        let lookupKey = title.toLowerCase();
        currentGallery = productGallery[lookupKey] || [];
        currentIndex = 0;
        updateMainImage();
        startCarousel();

        // Deselect all pills
        flavorBtns.forEach(btn => btn.classList.remove('selected'));
        sizeBtns.forEach(btn => btn.classList.remove('selected'));
        const customOrderBtn = document.querySelector('.custom-order-btn');
        if (customOrderBtn) customOrderBtn.classList.remove('selected');
        updatePlaceOrderBtn();

        document.body.classList.add('details-active');
    });
});

if (detailsBackBtn) {
    detailsBackBtn.addEventListener('click', () => {
        document.body.classList.remove('details-active');
        clearCarousel();
    });
}



if (sliderLeft) {
    sliderLeft.addEventListener('click', () => {
        prevImage();
        startCarousel();
    });
}

if (sliderRight) {
    sliderRight.addEventListener('click', () => {
        nextImage();
        startCarousel();
    });
}

flavorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const isSelected = btn.classList.contains('selected');
        flavorBtns.forEach(b => b.classList.remove('selected'));
        if (!isSelected) {
            btn.classList.add('selected');
        }
        updatePlaceOrderBtn();
    });
});

sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const isSelected = btn.classList.contains('selected');
        sizeBtns.forEach(b => b.classList.remove('selected'));
        if (!isSelected) {
            btn.classList.add('selected');
        }
        updatePlaceOrderBtn();
    });
});

const placeOrderBtn = document.getElementById('place-order-btn');
if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => {
        const selectedFlavor = document.querySelector('.flavor-btn.selected');
        const selectedSize = document.querySelector('.size-btn.selected');
        const customOrderBtn = document.querySelector('.custom-order-btn');
        const isCustomSelected = customOrderBtn && customOrderBtn.classList.contains('selected');

        // Only enforce flavor and size if it's NOT a custom order
        if (!isCustomSelected && (!selectedFlavor || !selectedSize)) {
            alert("Please select a flavor and an order size.");
            return;
        }

        if (isCustomSelected) {
            // REDIRECT TO CUSTOMIZE PAGE
            const flavor = selectedFlavor ? selectedFlavor.innerText.trim() : "";
            const size = selectedSize ? selectedSize.innerText.trim() : "";
            
            // Switch pages
            document.body.classList.remove('details-active');
            document.body.classList.add('customize-active');
            
            // Auto-select in Customize page
            const targetProduct = detailTitle.textContent.trim().toLowerCase();
            document.querySelectorAll('.coco-option-btn').forEach(btn => {
                const btnText = btn.textContent.trim().toLowerCase();
                if (btnText === targetProduct || btnText.includes(targetProduct) || targetProduct.includes(btnText)) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
            
            // Pre-fill description if options were selected
            let prefillValue = "";
            if (flavor && size) prefillValue = `${flavor}, ${size}`;
            else if (flavor) prefillValue = flavor;
            else if (size) prefillValue = size;
            
            customOrderText.value = prefillValue;
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // DIRECT WHATSAPP ORDER
            const message = `${detailTitle.innerText}, ${selectedFlavor.innerText} flavor, ${selectedSize.innerText}`;
            redirectToWhatsApp(message);
        }
    });
}

const customOrderBtn = document.querySelector('.custom-order-btn');
if (customOrderBtn) {
    customOrderBtn.addEventListener('click', () => {
        customOrderBtn.classList.toggle('selected');
    });
}

// ===== SCROLL CLAMPING =====
function clampPageOverflow(pageEl) {
    if (!pageEl) return;
    pageEl.style.overflowY = 'auto';
    requestAnimationFrame(() => {
        if (pageEl.scrollHeight <= pageEl.clientHeight + 1) {
            pageEl.style.overflowY = 'hidden';
        } else {
            pageEl.style.overflowY = 'auto';
        }
    });
}

const browsePageEl     = document.getElementById('browse-page');
const faqPageEl        = document.getElementById('faq-page');
const policiesPageEl   = document.getElementById('policies-page');
const productDetailsEl = document.getElementById('product-details-page');

const bodyObserver = new MutationObserver(() => {
    const body = document.body;
    if (body.classList.contains('browse-active'))   setTimeout(() => clampPageOverflow(browsePageEl),     850);
    if (body.classList.contains('faq-active'))      setTimeout(() => clampPageOverflow(faqPageEl),        850);
    if (body.classList.contains('policies-active')) setTimeout(() => clampPageOverflow(policiesPageEl),   850);
    if (body.classList.contains('details-active'))  setTimeout(() => clampPageOverflow(productDetailsEl), 850);
});
bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

document.addEventListener('click', (e) => {
    if (e.target.closest('.faq-category-title') || e.target.closest('.faq-question')) {
        setTimeout(() => clampPageOverflow(faqPageEl), 600);
    }
});

