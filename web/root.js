/* eslint-disable no-undef */
window.onload = async () => {
    initMDCElements();
};

/**
 * Configures and initializes Material components
 */
function initMDCElements() {
    // mdc.linearProgress.MDCLinearProgress.attachTo(document.querySelector('.mdc-linear-progress'));

    [].map.call(document.querySelectorAll('.mdc-text-field'), (el) => new mdc.textField.MDCTextField(el));
    $(() => {
        $('input.mdc-text-field__input').attr('disabled', true);
    });
}
