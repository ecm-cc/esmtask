/* eslint-disable no-undef */
window.onload = async () => {
    mdc.linearProgress.MDCLinearProgress.attachTo(document.querySelector('.mdc-linear-progress'));
    $('#overlay').show();
    const taskID = $('.mdc-layout-grid').attr('id');
    $(window).attr('location', `/able-esmtask/task?taskID=${taskID}&type=task`);
};
