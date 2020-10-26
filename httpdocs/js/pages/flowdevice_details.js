$(document).ready(function () {

    const TABLE_DATA_REFRESH = 15000;

	const generateColumns = () => {

		const columns = [
			{
				data: 'ifindex',
				width: '10%',
				render: (ifindex, type) => {
					if (type == "display") {
						return `<a href='${http_prefix}/lua/pro/enterprise/snmp_interface_details.lua?host=${flowDeviceIP}&snmp_port_idx=${ifindex}'>${ifindex}</a>`;
					}
					return ifindex;
				}
			},
			{
				data: 'name'
			},
			{
				data: 'chart',
				width: '10%',
				className: 'text-center',
			},
			{
				data: 'in_bytes',
				className: 'text-right',
				width: '15%',
				render: jQuery.fn.dataTableExt.sortBytes,
			},
			{
				data: 'out_bytes',
				className: 'text-right',
				width: '15%',
				render: jQuery.fn.dataTableExt.sortBytes,
			},
		]

		// if ratio is available then add the ratio column
		if (isRatioAvailable) {
			columns.push({
				data: 'ratio',
				className: 'text-center',
				render: (ratio, type) => {
					
					const THRESHOLD_VALUE = 0.8;

					if (type == "display" && ratio.value == -1) {
						return i18n.snmp_ratio_errors[ratio.status];
					}

					if (type == "display") {
						
						const pctg = (ratio.value * 100).toFixed(3);
						const pbClass = (ratio.value <= THRESHOLD_VALUE) ? 'bg-danger' : 'bg-success';

						return `
							<div class='progress position-relative'>
								<div style='width: ${pctg}%' role='progressbar' class='progress-bar ${pbClass}'>
								</div>
								<span class="justify-content-center d-flex position-absolute w-100">${ratio.value.toFixed(3)}</span>
							</div>
						`;
					}

					return ratio;
				}
			});
		}

		return columns;
	}

    let dtConfig = DataTableUtils.getStdDatatableConfig([
		{
			text: '<i class="fas fa-sync"></i>',
            className: 'btn-link',
			action: () => {
				$flowdeviceTable.ajax.reload();
			}
		}
	]);
    dtConfig = DataTableUtils.setAjaxConfig(dtConfig, `${http_prefix}/lua/pro/rest/v1/get/flowdevice/stats.lua?ip=${flowDeviceIP}`, 'rsp');
    dtConfig = DataTableUtils.extendConfig(dtConfig, {
	columns: generateColumns(),
	initComplete: function (settings, json) {
		setInterval(() => {
			$flowdeviceTable.ajax.reload();
		}, TABLE_DATA_REFRESH);
	}
	});
	
	const $flowdeviceTable = $(`table#flowdevice-list`).DataTable(dtConfig);
	
	$('[data-notification-id="flow_snmp_ratio"] a.btn').click(function() {
		// Enable SNMP and FlowDevice Timseries
		NtopUtils.setPref(
			'flowdevice_timeseries', 
			pageCSRF,
			(data) => {
				// reload the page after the submission to take effects
				if (data.success) location.reload();
			},
			(jqxhr, settings, ex) => {
				console.error(ex);
			}
		)
	});
});
