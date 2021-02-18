/* eslint-disable no-restricted-globals */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let task;
let metaData;
let createDialog;
let attachDialog;
const options = {
    headers: {
        Accept: 'application/hal+json',
        'Content-Type': 'application/hal+json',
    },
};

window.onload = async () => {
    task = $('#data-container').data('task');
    initMDCElements();
    showOverlay();
    metaData = $('#data-container').data('id');
    const documents = await loadDocuments(metaData);
    renderDocuments(documents);
    hideOverlay();
};

/**
 * Configures and initializes Material components
 */
function initMDCElements() {
    mdc.linearProgress.MDCLinearProgress.attachTo(document.querySelector('.mdc-linear-progress'));
    const radio = mdc.radio.MDCRadio.attachTo(document.querySelector('.mdc-radio'));
    const formField = mdc.formField.MDCFormField.attachTo(document.querySelector('.mdc-form-field'));
    formField.input = radio;
    attachDialog = new mdc.dialog.MDCDialog(document.querySelector('#attach-dialog'));
    createDialog = new mdc.dialog.MDCDialog(document.querySelector('#create-dialog'));
    [].map.call(document.querySelectorAll('.mdc-text-field'), (el) => new mdc.textField.MDCTextField(el));
    $(() => {
        $('.input-disabled').attr('disabled', true);
    });
    if (task.metadata.contractType.values[0] === 'supplierContract') {
        if (task.metadata.isGeneralAgreement.values[0] === 'true') {
            $('.option-2').attr('checked', true);
        } else {
            $('.option-1').attr('checked', true);
        }
    }
    snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
    snackBar.timeoutMs = 5000;
}

async function loadDocuments() {
    const httpOptions = options;
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
            <span class="mdc-list-item__text">${fileName}.${fileType}</span>
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

function showCreateContract() {
    $('.button-cell').hide();
    $('.create-contract').show();
}

function showAlternateContract() {
    $('.button-cell').hide();
    $('.alternate-contract').show();
}

function saveContract() {
    if (!$('.option-1').is(':checked') && !$('.option-2').is(':checked')) {
        failSnackbar('Bitte wählen Sie aus Einzelvertrag oder Rahmenvertrag!');
        return;
    }
    if (!$('#contractNumberCreate').val() || !$('#contractStatus').val() || $('#contractType').val() || $('#partnerName').val()) {
        failSnackbar('Bitte befüllen Sie alle Eingabefelder!');
        return;
    }
    const postData = {
        contractNumber: $('#contractNumberCreate').val(),
        contractStatus: $('#contractStatus').val(),
        contractType: $('#contractType').val(),
        partnerName: $('#partnerName').val(),
        categoryKey: $('.option-1').is(':checked') ? metaData.keys.singleContractCategory : metaData.keys.generalContractCategory,
    };
    createDialog.open();
    createDialog.listen('MDCDialog:closed', (reason) => {
        if (reason.detail.action === 'ok') {
            showOverlay();
            $.ajax({
                timeout: 90000,
                method: 'POST',
                url: `/able-esmtask/task?taskID=${task.id}`,
                data: postData,
            }).done(() => {
                hideOverlay();
                successSnackbar('Die Verknüpfung wurde erstellt, Seite wird neu geladen..');
                location.reload();
            }).fail((err) => {
                console.error(err);
                failSnackbar(`Die Verknüpfung konnte aufgrund eines Fehlers nicht durchgeführt werden: ${err.responseJSON ? err.responseJSON.reason : err}`);
                hideOverlay();
            });
        }
    });
}

function searchContract() {
    const contractNumber = $('#contractNumberSearch').val();
    const contractDesignation = $('#contractDesignation').val();
    const category = $('.option-1').is(':checked') ? metaData.keys.singleContractCategory : metaData.keys.generalContractCategory;
    if (!$('.option-1').is(':checked') && !$('.option-2').is(':checked')) {
        failSnackbar('Bitte wählen Sie aus Einzelvertrag oder Rahmenvertrag!');
        return;
    }
    if (!contractNumber && !contractDesignation) {
        failSnackbar('Bitte tragen Sie eine Vertragsnummer oder Vertragsbezeichnung ein.');
        return;
    }
    showOverlay();
    $.ajax({
        method: 'GET',
        url: getSearchURL(contractNumber, contractDesignation, category),
        headers: {
            Accept: 'application/hal+json',
            'Content-Type': 'application/hal+json',
        },
    }).done((data) => {
        renderResults(data);
        hideOverlay();
    }).fail((err) => {
        console.error(err);
        failSnackbar(`Die Suche konnte aufgrund eines Fehlers nicht durchgeführt werden: ${err.message ? err.message : err}`);
    });
}

function getSearchURL(contractNumber, contractDesignation, category) {
    const searchHost = `${metaData.config.host}/dms/r/${metaData.config.repositoryId}/sr/`;
    const searchCategory = `?objectdefinitionids=["${category}"]&`;
    const searchPropertyNumber = contractNumber ? `"${metaData.keys.contractNumberInternal}":["*${contractNumber}*"]` : '';
    const comma = contractNumber && contractDesignation ? ',' : '';
    const searchPropertyDesignation = contractDesignation ? `"${metaData.keys.contractDesignation}":["*${contractDesignation}*"]` : '';
    return encodeURI(`${searchHost}${searchCategory}properties={${searchPropertyNumber}${comma}${searchPropertyDesignation}}`);
}

function renderResults(results) {
    $('#result-list').html('');
    results.items.forEach((item) => {
        $('#result-list').append(`
            <li class="mdc-list-item" tabindex="0" id="${item.id}">
                <span class="mdc-list-item__ripple"></span>
                <span class="mdc-list-item__text">
                    <span class="mdc-list-item__primary-text">
                        ${item.caption}
                    </span>
                    <span class="mdc-list-item__secondary-text">
                        ${item.sortProperty.name} ${item.sortProperty.displayValue}
                    </span>
                </span>
            <span class="material-icons icon-right add-link"
                onclick="attachContract('${item.id}')">
                add
            </span>
            </li>
        `);
    });
    if (results.items.length === 0) {
        $('#result-list').append('Es wurden keine Ergebnisse gefunden.');
    }
    $('.search-result').show();
}

function attachContract(documentID) {
    attachDialog.open();
    attachDialog.listen('MDCDialog:closed', (reason) => {
        if (reason.detail.action === 'ok') {
            showOverlay();
            $.ajax({
                timeout: 90000,
                method: 'PUT',
                url: `/able-esmtask/task?contract=${documentID}&taskID=${task.id}`,
            }).done(() => {
                hideOverlay();
                successSnackbar('Die Verknüpfung wurde erstellt, Seite wird neu geladen..');
                location.reload();
            }).fail((err) => {
                console.error(err);
                failSnackbar(`Die Verknüpfung konnte aufgrund eines Fehlers nicht durchgeführt werden: ${err.responseJSON ? err.responseJSON.reason : err}`);
                hideOverlay();
            });
        }
    });
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
    $('.mdc-snackbar__surface').css('background-color', '#43A047');
    $('.mdc-snackbar__label').css('color', '#FFFFFF');
    $('.mdc-snackbar__label').text(text);
    snackBar.open();
    $('.mdc-snackbar__action').on('click', () => { snackBar.close(); });
}
