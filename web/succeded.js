/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let task;
let metaData;
let dialog;
let snackBar;

window.onload = async () => {
    showOverlay();
    initMDCElements();
    task = $('#data-container').data('task');
    metaData = $('#data-container').data('id');
    await loadContract();
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
}

async function loadContract() {
    const contractDetailLink = `${metaData.config.host}/dms/r/${metaData.config.repositoryId}/o2/${task.metadata.linkedContract.values[0]}`;
    const contractResponse = await $.ajax({
        url: contractDetailLink,
        dataType: 'json',
    });
    const contractNumber = contractResponse.objectProperties.find((prop) => prop.name === 'Vertragsnummer (intern)').value;
    const contractLink = `<a href="${contractDetailLink}" target="dapi_navigate">${contractNumber}</a>`;
    $('#contract-text').html(`Die Dokumente wurden ${contractLink} vom Typ "${contractResponse.category}" hinzugefügt.`);
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
