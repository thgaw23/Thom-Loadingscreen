// Cache DOM elements for better performance
const bgImage = document.getElementById("bg-image");
const barFill = document.getElementById("bar-fill");
const barText = document.getElementById("bar-text");
const currentResource = document.getElementById("current-resource");
const serverName = document.getElementById("server-name");

// Throttle progress updates
let lastProgressUpdate = 0;

// Background image rotation - loads images from backgrounds folder
(function initBackgrounds(){
    const images = [];
    let currentIndex = 0;
    let loadedCount = 0;
    
    // Try to load bg1-5 with different formats
    function tryLoadImage(index){
        const formats = ['.png', '.jpg', '.webp'];
        let formatIndex = 0;
        
        function attemptLoad(){
            if(formatIndex >= formats.length) return;
            
            const img = new Image();
            const filename = `backgrounds/bg${index}${formats[formatIndex]}`;
            img.src = filename;
            
            img.onload = function(){
                if(!images.find(i => i.src === img.src)){
                    images.push(img);
                    loadedCount++;
                    if(loadedCount === 1){
                        bgImage.style.backgroundImage = `url(${img.src})`;
                        bgImage.classList.add('fade-in', 'active');
                    }
                }
            };
            
            img.onerror = function(){
                formatIndex++;
                attemptLoad();
            };
            
            setTimeout(() => {
                if(!img.complete){
                    formatIndex++;
                    attemptLoad();
                }
            }, 500);
        }
        
        attemptLoad();
    }
    
    // Try to load up to 5 images
    for(let i = 1; i <= 5; i++){
        tryLoadImage(i);
    }
    
    // Fallback: if no images loaded after 3 seconds, try direct paths
    setTimeout(() => {
        if(images.length === 0 && bgImage){
            const directPaths = [
                'backgrounds/bg1.png', 'backgrounds/bg1.jpg',
                'backgrounds/bg2.png', 'backgrounds/bg2.jpg',
                'backgrounds/bg3.png', 'backgrounds/bg3.jpg',
                'backgrounds/bg4.png',
                'backgrounds/bg5.png', 'backgrounds/bg5.jpg'
            ];
            
            directPaths.forEach(path => {
                const img = new Image();
                img.src = path;
                img.onload = function(){
                    if(images.length === 0){
                        bgImage.style.backgroundImage = `url(${img.src})`;
                        bgImage.classList.add('fade-in', 'active');
                    }
                    if(!images.find(i => i.src === img.src)){
                        images.push(img);
                    }
                };
            });
        }
    }, 3000);
    
    // Function to change background with smooth transition
    function changeBackground(){
        if(images.length === 0) return;
        
        bgImage.classList.remove('fade-in', 'active');
        bgImage.classList.add('fade-out');
        
        setTimeout(() => {
            if(images.length > 0){
                const img = images[currentIndex];
                bgImage.style.backgroundImage = `url(${img.src})`;
                bgImage.classList.remove('fade-out');
                bgImage.classList.add('fade-in', 'active');
                currentIndex = (currentIndex + 1) % images.length;
            }
        }, 2000);
    }
    
    // Change background every 8 seconds
    setInterval(() => {
        if(images.length > 0){
            changeBackground();
        }
    }, 8000);
})();

// Handle loadProgress event
window.addEventListener("message", (e) => {
    if (e.data.eventName === "loadProgress") {
        // Update resource name if provided (can come without loadFraction)
        if(e.data.resourceName && e.data.resourceName !== "") {
            if(currentResource) {
                currentResource.textContent = `Loader: ${e.data.resourceName}`;
            }
        }
        
        // Update progress if loadFraction is provided
        if(e.data.loadFraction !== undefined) {
            const loaded = parseInt(e.data.loadFraction * 100);
            const now = performance.now();
            
            // Throttle updates to avoid too many DOM updates
            if(now - lastProgressUpdate < 50 && loaded < 100) {
                return;
            }
            lastProgressUpdate = now;
            
            // Update progress bar
            if(barFill) {
                barFill.style.width = `${loaded}%`;
            }
            
            // Update percentage text
            if(barText) {
                barText.textContent = `Loading ${loaded}%`;
            }
            
            // Update current resource if not already set
            if(currentResource && (!e.data.resourceName || e.data.resourceName === "")) {
                if(loaded < 100) {
                    if(!currentResource.textContent.includes(":")) {
                        currentResource.textContent = "Initialiserer...";
                    }
                } else {
                    currentResource.textContent = "Klar til at spille!";
                    if(serverName) {
                        serverName.textContent = "Klar til at spille!";
                    }
                }
            }
            
            // Update status steps based on progress
            updateStatusSteps(loaded);
        }
    }
});

// Function to update status steps based on progress
function updateStatusSteps(progress) {
    const stepItems = document.querySelectorAll(".step-item");
    const totalSteps = stepItems.length;
    const activeStep = Math.floor((progress / 100) * totalSteps);
    
    stepItems.forEach((item, index) => {
        if(index < activeStep) {
            item.classList.remove("active");
            item.classList.add("completed");
        } else if(index === activeStep && progress < 100) {
            item.classList.remove("completed");
            item.classList.add("active");
        } else {
            item.classList.remove("active", "completed");
        }
    });
    
    if(progress >= 100) {
        stepItems.forEach(item => {
            item.classList.remove("active");
            item.classList.add("completed");
        });
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize logo from config if defined
    if(typeof logo !== 'undefined' && logo) {
        const logoEl = document.querySelector(".logo") || document.getElementById("logo");
        if(logoEl) {
            // Only update if different from current src
            const newSrc = `assets/${logo}`;
            if(logoEl.src && !logoEl.src.endsWith(newSrc)) {
                logoEl.src = newSrc;
            }
            // Add error handling for logo
            logoEl.onerror = function() {
                console.warn('Logo image failed to load:', logoEl.src);
                // Fallback to default
                logoEl.src = 'assets/logo.png';
            };
        }
    }
});
