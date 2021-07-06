/* eslint-disable no-restricted-globals */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

function abortContract() {
    if ($('#abortText').val() === '') {
        failSnackbar('Bitte befüllen Sie die Nachricht an den Ticket-Ersteller!');
        return;
    }
    abortDialog.open();
    abortDialog.listen('MDCDialog:closed', (reason) => {
        if (reason.detail.action === 'ok') {
            showOverlay();
            $.ajax({
                method: 'DELETE',
                url: `/able-esmtask/task?taskID=${task.id}&specialStatus=abort`,
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
                failSnackbar(`Der Service-Request konnte aufgrund eines Fehlers nicht geschlossen werden: ${err.responseJSON ? err.responseJSON.reason : err}`);
                console.error(err);
            });
        }
    });
}

function patchServiceRequest() {
    patchDialog.open();
    patchDialog.listen('MDCDialog:closed', (reason) => {
        if (reason.detail.action === 'ok') {
            showOverlay();
            $.ajax({
                method: 'PATCH',
                url: `/able-esmtask/task?taskID=${task.id}`,
                dataType: 'json',
                data: {
                    abortText: $('#abortText').val(),
                },
            }).done(() => {
                hideOverlay();
                successSnackbar('Der Service-Request wurde erfolgreich geschlossen.');
                // eslint-disable-next-line no-restricted-globals
                location.reload();
            }).fail((err) => {
                failSnackbar(`Der Service-Request konnte aufgrund eines Fehlers nicht geschlossen werden: ${err.responseJSON ? err.responseJSON.reason : err}`);
                console.error(err);
            });
        }
    });
}
