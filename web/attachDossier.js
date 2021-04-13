/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
function showAttachDossier() {
    $('.button-cell').hide();
    $(`.attach-dossier.${type}`).show();
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
    const searchURL = getSearchURL(contractNumber, contractDesignation, category);
    doSearchRequest(searchURL);
}

function searchCase() {
    const caseNumber = $('#caseNumberSearch').val();
    const caseDesignation = $('#caseDesignation').val();
    if (!caseNumber && !caseDesignation) {
        failSnackbar('Bitte tragen Sie eine Vorgangsnummer oder Vorgangsbezeichnung ein.');
        return;
    }
    const searchURL = getSearchURL(caseNumber, caseDesignation, metaData.keys.caseCategory);
    doSearchRequest(searchURL);
}

function getSearchURL(internalNumber, designation, category) {
    const internalNumberField = type === 'contract' ? metaData.keys.contractNumberInternal : metaData.keys.caseNumberInternal;
    const designationField = type === 'contract' ? metaData.keys.contractDesignation : metaData.keys.caseDesignation;
    const searchHost = `${metaData.config.host}/dms/r/${metaData.config.repositoryId}/sr/`;
    const searchCategory = `?objectdefinitionids=["${category}"]&`;
    const searchPropertyNumber = internalNumber ? `"${internalNumberField}":["*${internalNumber}*"]` : '';
    const comma = internalNumber && designation ? ',' : '';
    const searchPropertyDesignation = designation ? `"${designationField}":["*${designation}*"]` : '';
    return encodeURI(`${searchHost}${searchCategory}properties={${searchPropertyNumber}${comma}${searchPropertyDesignation}}`);
}

function doSearchRequest(url) {
    showOverlay();
    $.ajax({
        method: 'GET',
        url,
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

function renderResults(results) {
    $(`#result-list-${type}`).html('');
    results.items.forEach((item) => {
        $(`#result-list-${type}`).append(`
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
                onclick="attachDossier('${item.id}')">
                add
            </span>
            </li>
        `);
    });
    if (results.items.length === 0) {
        $(`#result-list-${type}`).append('Es wurden keine Ergebnisse gefunden.');
    }
    $('.search-result-contract').show();
}

function collectdocumentProperties() {
    const documentProperties = {};
    documents.items.forEach((doc) => {
        documentProperties[doc.id] = {
            subject: $(`#subject-${doc.id}`).val(),
            type: $(`#type-${doc.id} .mdc-list .mdc-list-item--selected`).data('value'),
        };
    });
    return documentProperties;
}

function attachDossier(dossierID) {
    const postData = {};
    const esmBaseLink = `${metaData.config.ivantiBaseURL}/Default.aspx?Scope=ObjectWorkspace&Role=BusinessServiceAnalyst&CommandId=Search&ObjectType`;
    postData.esmLink = `${esmBaseLink}=ServiceReq#CommandData=RecId,=,0,${task.metadata.serviceRequestTechnicalID.values[0]},string,AND|#1615981839639`;
    if (type === 'case') {
        postData.documentProperties = JSON.stringify(collectdocumentProperties());
    }
    attachDialog.open();
    attachDialog.listen('MDCDialog:closed', (reason) => {
        if (reason.detail.action === 'ok') {
            showOverlay();
            $.ajax({
                timeout: 90000,
                method: 'PUT',
                url: `/able-esmtask/task?dossierID=${dossierID}&taskID=${task.id}&type=${type}`,
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
