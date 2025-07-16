// Main JavaScript file for NGDL website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100
        });
    }

    // Navigation functionality
    initNavigation();
    
    // Hero video error handling
    initHeroVideo();
    
    // Smooth scrolling for anchor links
    initSmoothScrolling();
    
    // Form validation (if contact form exists)
    initFormValidation();
    
    // Lightbox functionality
    initLightbox();
});

// Navigation Functions
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.getElementById('navbar');
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
    
    // Navbar scroll effect
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

// Hero Video Functions
function initHeroVideo() {
    const video = document.getElementById('hero-video');
    const fallbackImage = document.querySelector('.hero-fallback');
    
    if (video && fallbackImage) {
        video.addEventListener('error', function() {
            console.log('Video failed to load, showing fallback image');
            video.style.display = 'none';
            fallbackImage.style.display = 'block';
        });
        
        // Check if video can play
        video.addEventListener('canplay', function() {
            fallbackImage.style.display = 'none';
        });
        
        // Fallback for browsers that don't support the video format
        setTimeout(function() {
            if (video.readyState === 0) {
                video.style.display = 'none';
                fallbackImage.style.display = 'block';
            }
        }, 3000);
    }
}

// Smooth Scrolling Functions
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just "#"
            if (href === '#') return;
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Form Validation Functions
function initFormValidation() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(contactForm);
                const name = formData.get('name');
                const email = formData.get('email');
                const subject = formData.get('subject');
                const message = formData.get('message');
                
                // Clear previous error messages
                clearErrorMessages();
                
                let isValid = true;
                
                // Validate name
                if (!name || name.trim().length < 2) {
                    showError('name', 'Please enter a valid name (at least 2 characters)');
                    isValid = false;
                }
                
                // Validate email
                if (!email || !isValidEmail(email)) {
                    showError('email', 'Please enter a valid email address');
                    isValid = false;
                }
                
                // Validate subject
                if (!subject || subject.trim().length < 3) {
                    showError('subject', 'Please enter a subject (at least 3 characters)');
                    isValid = false;
                }
                
                // Validate message
                if (!message || message.trim().length < 10) {
                    showError('message', 'Please enter a message (at least 10 characters)');
                    isValid = false;
                }
                
                if (isValid) {
                    // Form is valid, show success message
                    showSuccessMessage('Thank you for your message! We will get back to you soon.');
                    contactForm.reset();
                }
                
            } catch (error) {
                console.error('Form validation error:', error);
                showError('general', 'An error occurred. Please try again.');
            }
        });
    }
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Error message functions
function showError(fieldName, message) {
    const field = document.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName);
    if (field) {
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-msg');
        if (existingError) {
            existingError.remove();
        }
        
        // Create and add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-msg';
        errorDiv.textContent = message;
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '0.9rem';
        errorDiv.style.marginTop = '5px';
        
        field.parentNode.appendChild(errorDiv);
        field.style.borderColor = '#e74c3c';
    }
}

function clearErrorMessages() {
    const errorMessages = document.querySelectorAll('.error-msg');
    errorMessages.forEach(msg => msg.remove());
    
    const fields = document.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
        field.style.borderColor = '';
    });
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-msg';
    successDiv.textContent = message;
    successDiv.style.color = '#27ae60';
    successDiv.style.fontSize = '1rem';
    successDiv.style.padding = '15px';
    successDiv.style.backgroundColor = '#d5f4e6';
    successDiv.style.border = '1px solid #27ae60';
    successDiv.style.borderRadius = '5px';
    successDiv.style.marginBottom = '20px';
    
    const form = document.getElementById('contact-form');
    if (form) {
        form.parentNode.insertBefore(successDiv, form);
        
        // Remove success message after 5 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
}

// Lightbox Functions
function initLightbox() {
    const galleryImages = document.querySelectorAll('.gallery-image');
    
    if (galleryImages.length > 0) {
        galleryImages.forEach(image => {
            image.addEventListener('click', function() {
                openLightbox(this.src, this.alt);
            });
        });
    }
}

function openLightbox(imageSrc, imageAlt) {
    try {
        // Create lightbox overlay
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox-overlay';
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            cursor: pointer;
        `;
        
        // Create image element
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = imageAlt;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 10px;
        `;
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 30px;
            background: none;
            border: none;
            color: white;
            font-size: 40px;
            cursor: pointer;
            z-index: 10000;
        `;
        
        // Add elements to lightbox
        lightbox.appendChild(img);
        lightbox.appendChild(closeBtn);
        document.body.appendChild(lightbox);
        
        // Close lightbox events
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox || e.target === closeBtn) {
                closeLightbox(lightbox);
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeLightbox(lightbox);
            }
        });
        
        // Handle image load error
        img.addEventListener('error', function() {
            console.error('Failed to load image in lightbox');
            closeLightbox(lightbox);
        });
        
    } catch (error) {
        console.error('Lightbox error:', error);
    }
}

function closeLightbox(lightbox) {
    if (lightbox && lightbox.parentNode) {
        lightbox.parentNode.removeChild(lightbox);
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for use in other scripts
window.NGDL = {
    openLightbox,
    closeLightbox,
    showError,
    clearErrorMessages,
    showSuccessMessage,
    debounce
};
