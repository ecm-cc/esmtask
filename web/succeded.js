/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let task;
let type;
let metaData;
let dialog;
let patchDialog;
let patchedDialog;
let snackBar;

window.onload = async () => {
    showOverlay();
    initMDCElements();
    task = $('#data-container').data('task');
    type = task.metadata.contractType.values[0] === 'supplierContract' || task.metadata.contractType.values[0] === 'rentalContract' ? 'contract' : 'case';
    metaData = $('#data-container').data('id');
    await $.getScript(`${metaData.assetBasePath}/specialStatus.js`);
    await loadDossierLinks();
    hideOverlay();
};

/**
 * Configures and initializes Material components
 */
function initMDCElements() {
    mdc.linearProgress.MDCLinearProgress.attachTo(document.querySelector('.mdc-linear-progress'));
    // eslint-disable-next-line no-unused-vars
    dialog = new mdc.dialog.MDCDialog(document.querySelector('#close-dialog'));
    patchDialog = new mdc.dialog.MDCDialog(document.querySelector('#patch-dialog'));
    patchedDialog = new mdc.dialog.MDCDialog(document.querySelector('#patched-dialog'));
    snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
    snackBar.timeoutMs = 5000;
    [].map.call(document.querySelectorAll('.mdc-text-field'), (el) => new mdc.textField.MDCTextField(el));
    $(() => {
        $('.input-disabled').attr('disabled', true);
    });
    if ($('.date-field').val()) {
        const date = new Date($('.date-field').val());
        const dateOptions = {
            year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Europe/Berlin',
        };
        $('.date-field').val(date.toLocaleString('de-DE', dateOptions));
    }
}

async function loadDossierLinks() {
    const dossierDetailLink = `${metaData.config.host}/dms/r/${metaData.config.repositoryId}/o2/${task.metadata.linkedContract.values[0]}`;
    const dossierResponse = await $.ajax({
        url: dossierDetailLink,
        dataType: 'json',
    });
    let internalNumber;
    if (type === 'contract') {
        internalNumber = dossierResponse.objectProperties.find((prop) => prop.name === 'Vertragsnummer (intern)').value;
    } else {
        internalNumber = dossierResponse.objectProperties.find((prop) => prop.name === 'Vorgangsnummer (intern)').value;
    }
    const dossierLink = `<a href="${dossierDetailLink}#details" target="dapi_navigate">${internalNumber}</a>`;
    const esmBaseLink = `${metaData.config.ivantiBaseURL}/Default.aspx?Scope=ObjectWorkspace&Role=BusinessServiceAnalyst&CommandId=Search&`;
    // eslint-disable-next-line max-len
    const esmLink = `${esmBaseLink}ObjectType=ServiceReq%23&CommandData=RecId%2c%3d%2c0%2c${task.metadata.serviceRequestTechnicalID.values[0]}%2cstring%2cAND%7c#1615981839639`;
    const esmLinkText = `<a href="${esmLink}" target="_blank">hier</a>`;
    $('#contract-text').html(`Die Dokumente wurden der "${dossierResponse.category}" ${dossierLink} hinzugefügt. 
    Das ESM-Ticket ist ${esmLinkText} hinterlegt.`);
}

function closeServiceRequest(alreadyPatched) {
    if (alreadyPatched) {
        patchedDialog.open();
        patchedDialog.listen('MDCDialog:closed', (reason) => {
            if (reason.detail.action === 'ok') {
                // eslint-disable-next-line no-restricted-globals
                parent.postMessage('TaskApp.completeTask', location.origin);
            }
        });
    } else {
        dialog.open();
        dialog.listen('MDCDialog:closed', (reason) => {
            if (reason.detail.action === 'ok') {
                showOverlay();
                $.ajax({
                    method: 'DELETE',
                    url: `/able-esmtask/task?taskID=${task.id}`,
                    dataType: 'json',
                    data: {
                        abortText: $('#abortText').val(),
                    },
                }).done(() => {
                    hideOverlay();
                    successSnackbar('Der Service-Request wurde erfolgreich geschlossen.');
                    // eslint-disable-next-line no-restricted-globals
                    parent.postMessage('TaskApp.completeTask', location.origin);
                }).fail((err) => {
                    failSnackbar(`Der Service-Request konnte nicht geschlossen werden: ${err.responseJSON ? err.responseJSON.reason : err}`);
                    console.error(err);
                });
            }
        });
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
