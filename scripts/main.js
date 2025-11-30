/**
 * DeepSyncSocial Frontend - Waitlist Form Handler
 * Handles form validation, submission, and user feedback
 */

document.addEventListener('DOMContentLoaded', () => {
    const ctaButton = document.getElementById('ctaButton');
    const waitlistForm = document.getElementById('waitlistForm');
    const formStatus = document.getElementById('formStatus');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const struggleSelect = document.getElementById('struggle');

    /* ========================================
       CTA Button - Scroll to Form
       ======================================== */
    if (ctaButton) {
        ctaButton.addEventListener('click', (e) => {
            e.preventDefault();
            const heroFormWrapper = document.querySelector('.hero-form-wrapper');
            if (heroFormWrapper) {
                heroFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                emailInput.focus();
            }
        });
    }

    /* ========================================
       Secondary CTA Button - Scroll to Form
       ======================================== */
    const ctaButtonSecondary = document.getElementById('ctaButtonSecondary');
    if (ctaButtonSecondary) {
        ctaButtonSecondary.addEventListener('click', (e) => {
            e.preventDefault();
            const heroFormWrapper = document.querySelector('.hero-form-wrapper');
            if (heroFormWrapper) {
                heroFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                emailInput.focus();
            }
        });
    }

    /* ========================================
       Form Submission & Validation
       ======================================== */
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', handleFormSubmit);
    }

    /**
     * Handle form submission
     */
    async function handleFormSubmit(e) {
        e.preventDefault();

        // Clear previous status
        clearStatus();

        // Get form values
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const struggle = struggleSelect.value;

        // Validate name
        if (!name) {
            showStatus('Please enter your name.', 'error');
            nameInput.focus();
            return;
        }

        // Validate email
        if (!email) {
            showStatus('Please enter your email address.', 'error');
            emailInput.focus();
            return;
        }

        if (!isValidEmail(email)) {
            showStatus('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }

        // Validate struggle selection
        if (!struggle) {
            showStatus('Please select what you struggle with most.', 'error');
            struggleSelect.focus();
            return;
        }

        // Prepare form data
        const formData = {
            name: name,
            email: email,
            struggle: struggle,
        };

        // Disable button and show loading state
        const submitBtn = waitlistForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;

        showStatus('Joining waitlist...', 'loading');

        try {
            // Send POST request to API
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Success: show message and reset form
                showStatus(data.message || "You're on the waitlist! ✅", 'success');
                waitlistForm.reset();
                emailInput.focus();
            } else {
                // Error from server
                showStatus(
                    data.message || 'Something went wrong. Please try again.',
                    'error'
                );
            }
        } catch (error) {
            // Network or parse error
            console.error('Form submission error:', error);
            showStatus(
                'Network error. Please check your connection and try again.',
                'error'
            );
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    /**
     * Validate email format with regex
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Show status message
     */
    function showStatus(message, type) {
        formStatus.textContent = message;
        formStatus.className = `form-status ${type}`;
    }

    /**
     * Clear status message
     */
    function clearStatus() {
        formStatus.textContent = '';
        formStatus.className = 'form-status';
    }

    /* ========================================
       FAQ Accordion
       ======================================== */
    // Using native <details> element for better accessibility
    // No JS needed - browsers handle it natively!

    /* ========================================
       Contact Modal
       ======================================== */
    const contactLink = document.getElementById('contactLink');
    const contactModal = document.getElementById('contactModal');
    const closeModal = document.getElementById('closeModal');

    if (contactLink) {
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            openContactModal();
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', closeContactModal);
    }

    // Close modal when clicking outside of it
    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                closeContactModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && contactModal && contactModal.classList.contains('active')) {
            closeContactModal();
        }
    });

    function openContactModal() {
        if (contactModal) {
            contactModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeContactModal() {
        if (contactModal) {
            contactModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

