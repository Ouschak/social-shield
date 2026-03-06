/**
 * Apply blur effect to an element containing hate speech
 */
export function applyBlur(element: HTMLElement, confidence: number): void {
    // Wrap element if not already wrapped
    let wrapper = element.parentElement;
    if (!wrapper?.classList.contains('creator-shield-wrapper')) {
        wrapper = document.createElement('div');
        wrapper.className = 'creator-shield-wrapper';
        element.parentNode?.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    }

    element.classList.add('creator-shield-blurred');
    element.dataset.shieldConfidence = String(Math.round(confidence * 100));
}

/**
 * Add a "Show anyway" button to reveal blurred content
 */
export function addRevealButton(element: HTMLElement): void {
    const wrapper = element.parentElement;
    if (!wrapper || wrapper.querySelector('.creator-shield-reveal')) {
        return;
    }

    const button = document.createElement('button');
    button.className = 'creator-shield-reveal';
    button.textContent = 'Afficher quand même';
    button.setAttribute('aria-label', 'Révéler le contenu masqué');

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        revealContent(element);
        button.remove();
    });

    wrapper.appendChild(button);
}

/**
 * Reveal previously blurred content
 */
export function revealContent(element: HTMLElement): void {
    element.classList.remove('creator-shield-blurred');
    element.classList.add('creator-shield-revealed');
}

/**
 * Remove all blur effects from an element
 */
export function removeBlur(element: HTMLElement): void {
    element.classList.remove('creator-shield-blurred', 'creator-shield-revealed');
    delete element.dataset.shieldConfidence;

    const wrapper = element.parentElement;
    if (wrapper?.classList.contains('creator-shield-wrapper')) {
        const revealBtn = wrapper.querySelector('.creator-shield-reveal');
        revealBtn?.remove();
    }
}
