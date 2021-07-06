/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let isValidPartner = false;

function showCreateDossier() {
    showOverlay();
    $('.button-cell').hide();
    if (type === 'contract') {
        clearAttachmentUploadBoxes();
    }
    loadAsyncData().then(() => {
        $(`.create-dossier.${type}`).show();
        hideOverlay();
    });
}

function clearAttachmentUploadBoxes() {
    documents.items.forEach((doc) => {
        if ($(`#upload-${doc.id}`).is(':checked')) {
            $(`#upload-${doc.id}`).click();
            $(`#upload-${doc.id}`).attr('disabled', 'disabled');
        }
    });
}

async function loadAsyncData() {
    await generateInternalNumbers();
    if (type === 'contract') {
        await loadDropdown(metaData.keys.contractType, 'option-list-contractType');
        await loadDropdown(metaData.keys.contractStatus, 'option-list-contractStatus');
        $('#partnerName').on('keyup', async () => { await listenPartnerInput(); });
        selectContractType = new mdc.select.MDCSelect(document.querySelector('#contractType'));
        if (task.metadata.contractType.values[0] === 'rentalContract') {
            selectContractType.value = 'Lieferant - Mietvertrag Immobilien';
            selectContractType.disabled = true;
        }
        selectContractStatus = new mdc.select.MDCSelect(document.querySelector('#contractStatus'));
        selectContractStatus.value = 'Initiierung';
        selectContractStatus.disabled = true;

        await loadDropdown(metaData.keys.contractSubType, 'option-list-contractSubType', selectContractType.value);
        selectContractType.listen('MDCSelect:change', (el) => {
            selectContractSubType.value = '';
            loadDropdown(metaData.keys.contractSubType, 'option-list-contractSubType', selectContractType.value);
        });
        selectContractSubType = new mdc.select.MDCSelect(document.querySelector('#contractSubType'));
    } else {
        await loadDropdown(metaData.keys.caseContractType, 'option-list-caseContractType');
        await loadDropdown(metaData.keys.organisationUnit, 'option-list-organisationunit');
        selectCaseType = new mdc.select.MDCSelect(document.querySelector('#caseType'));
        selectCaseType.value = 'VP-Vertragsprüfung';
        selectCaseContractType = new mdc.select.MDCSelect(document.querySelector('#caseContractType'));
        selectCaseOrganisationunit = new mdc.select.MDCSelect(document.querySelector('#organisationunit'));
        selectCaseOrganisationunit.value = getOrganisationUnit();
    }
}

async function generateInternalNumbers() {
    if (type === 'contract') {
        const generalContractInternalNumber = await loadNextInternalNumber(metaData.keys.generalContractCategory);
        const singleContractInternalNumber = await loadNextInternalNumber(metaData.keys.singleContractCategory);
        $('.option-1').on('click', () => {
            $('#contractNumberCreate').val(singleContractInternalNumber);
        });
        $('.option-2').on('click', () => {
            $('#contractNumberCreate').val(generalContractInternalNumber);
        });
        if (task.metadata.contractType.values[0] === 'rentalContract') {
            $('.option-1').click();
            radioSingleContract.checked = true;
        } else {
            $('.option-2').click();
            radioGeneralContract.checked = true;
        }
    } else {
        const caseInternalNumber = await loadNextInternalNumber(metaData.keys.caseCategory);
        $('#caseNumberCreate').val(caseInternalNumber);
    }
}

async function loadNextInternalNumber(categoryKey) {
    const urlHost = `${metaData.config.host}/dms/sr/?objectdefinitionids=["${categoryKey}"]`;
    const urlParams = `&repositoryid=${metaData.config.repositoryId}&propertysort=property_creation_date&ascending=false`;
    const url = `${urlHost}${urlParams}`;
    const internalNumberPrefix = metaData.config.internalNumberPrefix[categoryKey];
    const searchResults = await $.ajax({
        method: 'GET',
        url,
        headers: {
            Accept: 'application/hal+json',
            'Content-Type': 'application/hal+json',
        },
    });
    let latestInternalNumber;
    let found = false;
    const regEx = new RegExp(metaData.config.internalNumberRegEx[categoryKey]);
    searchResults.items.forEach((result) => {
        let internalNumber;
        if (type === 'contract') {
            internalNumber = result.displayProperties.find((prop) => prop.id === metaData.keys.contractNumberInternal.toString()).value;
        } else {
            internalNumber = result.displayProperties.find((prop) => prop.id === metaData.keys.caseNumberInternal.toString()).value;
        }
        if (regEx.test(internalNumber) && !found) {
            latestInternalNumber = internalNumber;
            found = true;
        }
    });
    if (!found) {
        latestInternalNumber = `${internalNumberPrefix}-${new Date().getFullYear()}-00001`;
    } else {
        const latestInternalNumberArray = latestInternalNumber.split('-');
        const internalNumberInt = parseInt(latestInternalNumberArray[2], 10) + 1;
        latestInternalNumber = `${internalNumberPrefix}-${new Date().getFullYear()}-00000`;
        latestInternalNumber = latestInternalNumber.substr(0, latestInternalNumber.length - internalNumberInt.toString().length);
        latestInternalNumber += internalNumberInt;
    }
    return latestInternalNumber;
}

async function loadDropdown(key, listID, searchString, isAttachment, isPartner) {
    const dropdownValues = await $.ajax({
        method: 'POST',
        url: `${metaData.config.host}/dms/r/${metaData.config.repositoryId}/validvalues/p/${key}?rownumber=1`,
        headers: {
            Accept: 'application/hal+json',
            'Content-Type': 'application/hal+json',
        },
        data: getDMSBody(searchString, isAttachment, isPartner),
    });
    if (listID) {
        $(`#${listID}`).html('');
        dropdownValues.values.forEach((dropdownType) => {
            $(`#${listID}`).append(`
                <li class="mdc-list-item" data-value="${dropdownType.value}">
                    <span class="mdc-list-item__ripple"></span>
                    <span class="mdc-list-item__text">${dropdownType.value}</span>
                </li>
            `);
        });
    }
    return dropdownValues;
}

function getOrganisationUnit() {
    const department = task.metadata.department.values[0];
    const orgUnit = selectCaseOrganisationunit.menuItemValues.find((item) => item.includes(department));
    return orgUnit || '';
}

function getDMSBody(searchString, isAttachment, isPartner) {
    const extendedProperties = {};
    const multivalueExtendedProperties = {};
    let objectDefinitionId;
    if (isAttachment) {
        if (type === 'contract') {
            objectDefinitionId = metaData.keys.contractDocumentCategory;
        } else {
            objectDefinitionId = metaData.keys.caseDocumentCategory;
        }
    } else if (type === 'contract') {
        objectDefinitionId = metaData.keys.singleContractCategory;
    } else {
        objectDefinitionId = metaData.keys.caseCategory;
    }
    if (searchString) {
        if (isPartner) {
            extendedProperties[metaData.keys.partnerName] = searchString;
            multivalueExtendedProperties[metaData.keys.partnerName] = { 1: searchString };
        } else {
            extendedProperties[metaData.keys.contractType] = searchString;
        }
    }
    return JSON.stringify({
        dossierId: null,
        extendedProperties,
        multivalueExtendedProperties,
        objectDefinitionId,
        remarks: {},
        storeObject: {
            masterFileName: null, filename: null, parentId: null, dmsObjectId: null, displayValue: null,
        },
        displayValue: null,
        dmsObjectId: null,
        filename: null,
        masterFileName: null,
        parentId: null,
        systemProperties: {},
        type: 2,
    });
}

async function listenPartnerInput() {
    isValidPartner = false;
    const input = $('#partnerName').val();
    if (input.length > 2) {
        const results = await loadDropdown(metaData.keys.partnerName, null, input, false, true);
        const partnerHTML = [];
        results.values.forEach((partnerName, i) => partnerHTML.push(`
        <li class="mdc-list-item" role="menuitem" onclick="setPartner('${partnerName.value}', ${i})">
            <span class="mdc-list-item__ripple"></span>
            <span class="mdc-list-item__text">${partnerName.value}</span>
        </li>`));
        if (results.values.length === 0) {
            partnerHTML.push(`
            <li class="mdc-list-item mdc-list-item--disabled" role="menuitem">
                <span class="mdc-list-item__ripple"></span>
                <span class="mdc-list-item__text">Keine Partner gefunden</span>
            </li>`);
        }
        $('#partner-list').html(partnerHTML.join(''));
        menu.open = true;
        $('#partnerName').focus();
    }
}

function setPartner(partnerName) {
    isValidPartner = true;
    $('#partnerName').val(partnerName);
}

function saveContract() {
    if (!$('.option-1').is(':checked') && !$('.option-2').is(':checked')) {
        failSnackbar('Bitte wählen Sie aus Einzelvertrag oder Rahmenvertrag!');
        return;
    }
    if (!isValidPartner) {
        $('#partnerName').val('');
    }
    // TODO: New validation for needed fields - Check with Kutzi
    if (!$('#contractNumberCreate').val() || selectContractStatus.value === '' || selectContractType.value === '' || !isValidPartner) {
        failSnackbar('Bitte befüllen Sie alle Eingabefelder mit gültigen Werten!');
        return;
    }
    const postData = {
        type: 'contract',
        contractNumber: $('#contractNumberCreate').val(),
        contractType: selectContractType.value,
        contractStatus: selectContractStatus.value,
        contractTitle: $('#contractTitle').val(),
        contractSubType: selectContractSubType.value,
        partnerName: $('#partnerName').val(),
        contractValue: task.metadata.contractValue ? task.metadata.contractValue.values[0] : null,
        responsiblePerson: $('#contractResponsible').val(),
        categoryKey: $('.option-1').is(':checked') ? metaData.keys.singleContractCategory : metaData.keys.generalContractCategory,
        documentProperties: JSON.stringify(collectContractDocumentProperties()),
    };
    sendDossier(postData);
}

function saveCase() {
    if (!$('#caseNumberCreate').val() || selectCaseType.value === '' || selectCaseContractType.value === '' || selectCaseOrganisationunit.value === '') {
        failSnackbar('Bitte befüllen Sie alle Eingabefelder mit gültigen Werten!');
        return;
    }
    const esmBaseLink = `${metaData.config.ivantiBaseURL}/Default.aspx?Scope=ObjectWorkspace&Role=BusinessServiceAnalyst&CommandId=Search&ObjectType=Service`;
    const esmLink = `${esmBaseLink}Req%23&CommandData=RecId%2c%3d%2c0%2c${task.metadata.serviceRequestTechnicalID.values[0]}%2cstring%2cAND%7c#1615981839639`;
    const postData = {
        type: 'case',
        caseNumber: $('#caseNumberCreate').val(),
        contractType: selectCaseContractType.value,
        caseType: selectCaseType.value,
        caseOrganisationunit: selectCaseOrganisationunit.value,
        categoryKey: metaData.keys.caseCategory,
        esmLink,
        orgunitContact: task.metadata.responsiblePerson.values[0],
        documentProperties: JSON.stringify(collectCaseDocumentProperties()),
    };
    sendDossier(postData);
}

function collectContractDocumentProperties() {
    const documentProperties = {};
    documents.items.forEach((doc) => {
        dateString = $(`#date-${doc.id}`).val();
        documentProperties[doc.id] = {
            subject: $(`#subject-${doc.id}`).val(),
            type: $(`#type-${doc.id} .mdc-list .mdc-list-item--selected`).data('value'),
            folder: $(`#folder-${doc.id}`).val(),
            date: dateString !== '' ? `${dateString.substring(6)}-${dateString.substring(3, 5)}-${dateString.substring(0, 2)}` : dateString,
            version: $(`#version-${doc.id}`).val(),
        };
    });
    return documentProperties;
}

function collectCaseDocumentProperties() {
    const documentProperties = {};
    documents.items.forEach((doc) => {
        documentProperties[doc.id] = {
            subject: $(`#subject-${doc.id}`).val(),
            type: $(`#type-${doc.id} .mdc-list .mdc-list-item--selected`).data('value'),
        };
    });
    return documentProperties;
}

function sendDossier(postData) {
    createDialog.open();
    createDialog.listen('MDCDialog:closed', (reason) => {
        if (reason.detail.action === 'ok') {
            $('.save-button').hide();
            showOverlay();
            $.ajax({
                timeout: 90000,
                method: 'POST',
                url: `/able-esmtask/task?taskID=${task.id}&type=${type}`,
                data: postData,
            }).done(() => {
                hideOverlay();
                successSnackbar('Die Verknüpfung wurde erstellt, Seite wird neu geladen..');
                // eslint-disable-next-line no-restricted-globals
                location.reload();
            }).fail((err) => {
                hideOverlay();
                console.error(err);
                failSnackbar(`Die Verknüpfung konnte aufgrund eines Fehlers nicht durchgeführt werden: ${err.responseJSON ? err.responseJSON.reason : err}`);
                // eslint-disable-next-line no-restricted-globals
                location.reload();
            });
        }
    });
}
