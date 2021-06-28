/* eslint-disable no-restricted-globals */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let task;
let type;
let documents;
let metaData;
let createDialog;
let attachDialog;
let menu;
let selectContractStatus;
let selectContractType;
let selectCaseContractType;
let selectCaseType;
let selectCaseOrganisationunit;
const options = {
    headers: {
        Accept: 'application/hal+json',
        'Content-Type': 'application/hal+json',
    },
};

window.onload = async () => {
    showOverlay();
    mdc.linearProgress.MDCLinearProgress.attachTo(document.querySelector('.mdc-linear-progress'));
    task = $('#data-container').data('task');
    type = task.metadata.contractType.values[0] === 'supplierContract' || task.metadata.contractType.values[0] === 'rentalContract' ? 'contract' : 'case';
    initMDCElements();
    metaData = $('#data-container').data('id');
    await $.getScript(`${metaData.assetBasePath}/createDossier.js`);
    await $.getScript(`${metaData.assetBasePath}/attachDossier.js`);
    await $.getScript(`${metaData.assetBasePath}/loadAttachments.js`);
    documents = await loadDocuments(metaData);
    await renderDocuments();
    hideOverlay();
};

/**
 * Configures and initializes Material components
 */
function initMDCElements() {
    attachDialog = new mdc.dialog.MDCDialog(document.querySelector('#attach-dialog'));
    createDialog = new mdc.dialog.MDCDialog(document.querySelector('#create-dialog'));
    [].map.call(document.querySelectorAll('.mdc-text-field'), (el) => new mdc.textField.MDCTextField(el));
    [].map.call(document.querySelectorAll('.mdc-list'), (el) => new mdc.list.MDCList(el));
    $(() => {
        $('.input-disabled').attr('disabled', true);
    });

    snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
    snackBar.timeoutMs = 10000;
    if ($('.date-field').val()) {
        const date = new Date($('.date-field').val());
        const dateOptions = {
            year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Europe/Berlin',
        };
        $('.date-field').val(date.toLocaleString('de-DE', dateOptions));
    }
    if (type === 'contract') {
        // TODO: Is this still right?
        menu = new mdc.menu.MDCMenu(document.querySelector('#partner-options'));
        const radio = mdc.radio.MDCRadio.attachTo(document.querySelector('.mdc-radio'));
        const formField = mdc.formField.MDCFormField.attachTo(document.querySelector('.mdc-form-field'));
        formField.input = radio;
        if (task.metadata.contractType.values[0] === 'supplierContract') {
            if (task.metadata.isGeneralAgreement.values[0] === 'true') {
                $('.option-2').attr('checked', true);
            } else {
                $('.option-1').attr('checked', true);
            }
        }
    }
}

/**
 * Shows a gray overlay for loading purposes
 */
function showOverlay() {
    $('#overlay').show();
}

/**
 * Hides a gray overlay when content is loaded
 */
function hideOverlay() {
    $('#overlay').hide();
}

/**
 * Shows a MDC Snackbar, used for errors
 * @param {string} text Text to be shown
 */
function failSnackbar(text) {
    snackBar.close();
    $('.mdc-snackbar__surface').css('background-color', '#B00020');
    $('.mdc-snackbar__label').css('color', '#FFFFFF');
    $('.mdc-snackbar__label').text(text);
    snackBar.open();
    $('.mdc-snackbar__action').on('click', () => { snackBar.close(); });
}

/**
 * Shows a MDC Snackbar, used for the success messages
 * @param {string} text Text to be shown
 */
function successSnackbar(text) {
    snackBar.close();
    $('.mdc-snackbar__surface').css('background-color', '#43A047');
    $('.mdc-snackbar__label').css('color', '#FFFFFF');
    $('.mdc-snackbar__label').text(text);
    snackBar.open();
    $('.mdc-snackbar__action').on('click', () => { snackBar.close(); });
}
