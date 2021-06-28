/* eslint-disable no-restricted-globals */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
async function loadDocuments() {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = metaData.documentURL;
    const response = await $.get(httpOptions);
    return response;
}

async function renderDocuments() {
    if (documents.items.length === 0) {
        $('.attachment-list').html('Es wurden keine Dokumente gefunden.');
    } else {
        const listHTML = [];
        const values = await loadDropdown(metaData.keys.caseContractDocumentType, null, null, true);
        let valuesHTML = [];
        valuesHTML = values.values.map((value) => `<li class="mdc-list-item" data-value="${value.value}">
            <span class="mdc-list-item__ripple"></span>
            <span class="mdc-list-item__text">${value.value}</span>
        </li>`);
        documents.items.forEach((doc, i) => {
            const fileName = doc.displayProperties.find((prop) => prop.id === 'property_filename').value.split('.')[0];
            const fileType = doc.displayProperties.find((prop) => prop.id === 'property_filetype').value.toLowerCase();
            $('.attachment-list').append(`
            <div class="attachment-element mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
                <div>
                    <i class="fa-2x ${getFileTypeIcon(fileType)} fas" aria-hidden="true">
                    </i>
                    <a class="href_list" href="${doc._links.details.href}" target="dapi_navigate" style="margin-left: 20px;">
                        <span class="mdc-typography--body2">${fileName}.${fileType}</span>
                    </a>
                </div>
            </div>
            TODO: CS-Änderung oder Anpassungen je nach Legal/CS für die nötigen Felder bei Dokumenten
            <div class="attachment-element mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
                <label class="mdc-text-field mdc-text-field--outlined mdc-text-field--label-floating">
                    <span class="mdc-notched-outline mdc-notched-outline--upgraded mdc-notched-outline--notched">
                        <span class="mdc-notched-outline__leading"></span>
                        <span class="mdc-notched-outline__notch">
                            <span class="mdc-floating-label mdc-floating-label--float-above" id="subject-${doc.id}-label" style="">Betreff</span>
                        </span>
                        <span class="mdc-notched-outline__trailing"></span>
                    </span>
                    <input type="text" id="subject-${doc.id}" class="mdc-text-field__input" aria-labelledby="subject-${document.id}-label">
                </label>
            </div>
            <div class="attachment-element mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
                <div class="mdc-select mdc-select--outlined" id="type-${doc.id}" style="width: 100%;">
                    <div class="mdc-select__anchor" tabindex="0" aria-disabled="false">
                        <span class="mdc-notched-outline mdc-notched-outline--upgraded">
                            <span class="mdc-notched-outline__leading"></span>
                            <span class="mdc-notched-outline__notch">
                                <span id="outlined-select-label" class="mdc-floating-label" style="">Typ Vorgangsunterlage</span>
                            </span>
                            <span class="mdc-notched-outline__trailing"></span>
                        </span>
                        <span class="mdc-select__selected-text-container">
                        <span class="mdc-select__selected-text"></span>
                        </span>
                        <span class="mdc-select__dropdown-icon">
                            <svg class="mdc-select__dropdown-icon-graphic" viewBox="7 10 10 5" focusable="false">
                                <polygon class="mdc-select__dropdown-icon-inactive" stroke="none" fill-rule="evenodd" points="7 10 12 15 17 10">
                                </polygon>
                                <polygon class="mdc-select__dropdown-icon-active" stroke="none" fill-rule="evenodd" points="7 15 12 10 17 15">
                                </polygon>
                            </svg>
                        </span>
                    </div>
                    <div class="mdc-select__menu mdc-menu mdc-menu-surface">
                        <ul class="mdc-list" id="option-list-${doc.id}">
                            ${valuesHTML.join('')}
                        </ul>
                    </div>
                </div>
            </div>
            <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12"></div>
            `);
            const select = new mdc.select.MDCSelect(document.querySelector(`#type-${doc.id}`));
            select.value = 'zu definieren';
        });
        if (documents.items.length === 0) {
            listHTML.push('Es wurden keine Ergebnisse gefunden.');
        }
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
