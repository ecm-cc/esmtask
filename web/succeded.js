/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let task;
let type;
let metaData;
let dialog;
let snackBar;

window.onload = async () => {
    showOverlay();
    initMDCElements();
    task = $('#data-container').data('task');
    type = task.metadata.contractType.values[0] === 'supplierContract' || task.metadata.contractType.values[0] === 'rentalContract' ? 'contract' : 'case';
    metaData = $('#data-container').data('id');
    await loadDossier();
    hideOverlay();
};

/**
 * Configures and initializes Material components
 */
function initMDCElements() {
    mdc.linearProgress.MDCLinearProgress.attachTo(document.querySelector('.mdc-linear-progress'));
    // eslint-disable-next-line no-unused-vars
    dialog = new mdc.dialog.MDCDialog(document.querySelector('.mdc-dialog'));
    snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
    snackBar.timeoutMs = 5000;
    [].map.call(document.querySelectorAll('.mdc-text-field'), (el) => new mdc.textField.MDCTextField(el));
    $(() => {
        $('.input-disabled').attr('disabled', true);
    });
    if ($('.date-field').val()) {
        const date = new Date($('.date-field').val());
        const dateOptions = {
            year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: 'Europe/Berlin',
        };
        $('.date-field').val(date.toLocaleString('de-DE', dateOptions));
    }
}

async function loadDossier() {
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
    $('#contract-text').html(`Die Dokumente wurden ${dossierLink} vom Typ "${dossierResponse.category}" hinzugefügt.`);
}

function closeServiceRequest() {
    dialog.open();
    dialog.listen('MDCDialog:closed', (reason) => {
        if (reason.detail.action === 'ok') {
            showOverlay();
            $.ajax({
                method: 'DELETE',
                url: `/able-esmtask/task?taskID=${task.id}`,
                dataType: 'json',
            }).done(() => {
                hideOverlay();
                successSnackbar('Der Service-Request wurde erfolgreich geschlossen.');
                // eslint-disable-next-line no-restricted-globals
                parent.postMessage('TaskApp.completeTask', location.origin);
            }).fail((err) => {
                failSnackbar(`Der Service-Request konnte aufgrund eines Fehlers nicht geschlossen werden: ${err.responseJSON ? err.responseJSON.reason : err}`);
                console.error(err);
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
