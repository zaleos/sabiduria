$(document).ready(function () {
    let request = function () {
        const productId = document.getElementById('productId').value;
        const query = $('#typeahead').val();

        $.get('/' + productId + '/search?key=' + query, function (data) {
            const body = $('#versions tbody');
            const result = jQuery.parseJSON(data);
            const versions = result.versions;

            body.empty();

            for (let i = 0; i < versions.length; i++) {
                // const row = $('<tr>');
                const row = document.createElement('tr');
                const td = document.createElement('td');
                td.appendChild(document.createTextNode(versions[i]));
                row.appendChild(td);

                const ahtml = document.createElement('a');
                ahtml.appendChild(document.createTextNode('html'));
                ahtml.target = '_blank';

                if (versions[i] === result.lastVersion) {

                    ahtml.href = '/' + productId + '/latest/user/en/html/index.html';
                } else {

                    ahtml.href = '/' + productId + '/' + versions[i] + '/user/en/html/index.html';
                }

                const tdhtml = document.createElement('td');
                tdhtml.appendChild(ahtml);
                row.appendChild(tdhtml);

                body.append(row);
            }
        });
    };

    $('#typeahead').keyup(function (e) {
        timeout = setTimeout(request, 500);
    });

    $('#filterbutton').click(function () {
        request();
    });

    request();
});
