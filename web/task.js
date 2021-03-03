/* eslint-disable no-restricted-globals */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let task;
let type;
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
    task = $('#data-container').data('task');
    type = task.metadata.contractType.values[0] === 'supplierContract' || task.metadata.contractType.values[0] === 'rentalContract' ? 'contract' : 'case';
    initMDCElements();
    showOverlay();
    metaData = $('#data-container').data('id');
    await $.getScript(`${metaData.assetBasePath}/createDossier.js`);
    await $.getScript(`${metaData.assetBasePath}/attachDossier.js`);
    const documents = await loadDocuments(metaData);
    renderDocuments(documents);
    hideOverlay();
};

/**
 * Configures and initializes Material components
 */
function initMDCElements() {
    mdc.linearProgress.MDCLinearProgress.attachTo(document.querySelector('.mdc-linear-progress'));
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
            year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: 'Europe/Berlin',
        };
        $('.date-field').val(date.toLocaleString('de-DE', dateOptions));
    }
    if (type === 'contract') {
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

async function loadDocuments() {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = metaData.documentURL;
    const response = await $.get(httpOptions);
    return response;
}

function renderDocuments(documents) {
    if (documents.items.length === 0) {
        $('.attachment-list').html('Es wurden keine Dokumente gefunden.');
    } else {
        const listHTML = [];
        documents.items.forEach((document, i) => {
            const fileName = document.displayProperties.find((prop) => prop.id === 'property_filename').value.split('.')[0];
            const fileType = document.displayProperties.find((prop) => prop.id === 'property_filetype').value.toLowerCase();
            listHTML.push(`<li class="mdc-list-item" ${i === 0 ? 'tabindex="0"' : ''}>
            <i class="mdc-list-item__graphic fa-2x ${getFileTypeIcon(fileType)} fas" aria-hidden="true">
            </i>
            <a class="href_list" href="${document._links.details.href}" target="dapi_navigate">
                <span class="mdc-list-item__text">${fileName}.${fileType}</span>
            </a>
         </li>`);
        });
        if (documents.items.length === 0) {
            listHTML.push('Es wurden keine Ergebnisse gefunden.');
        }
        $('.attachment-list').append(listHTML.join(''));
        $('.attachments').show();
    }
}

function getFileTypeIcon(fileType) {
    switch (fileType) {
    case 'csv': return 'fa-file-csv';
    case 'doc':
    case 'docx': return 'fa-file-word';
    case 'htm':
    case 'html': return 'fa-file-edge';
    case 'dgix':
    case 'msg': return 'fa-envelope';
    case 'pdf': return 'fa-file-pdf';
    case 'pps':
    case 'ppt':
    case 'pptx': return 'fa-file-powerpoint';
    case 'bmp':
    case 'gif':
    case 'jpeg':
    case 'jpg':
    case 'png':
    case 'tif': return 'fa-file-image';
    case 'xls':
    case 'xlsx': return 'fa-file-excel';
    case 'rtf':
    case 'txt':
    case 'xml': return 'fa-file-alt';
    case 'rar':
    case 'zip': return 'fa-file-zip';
    default: return 'fa-file';
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
