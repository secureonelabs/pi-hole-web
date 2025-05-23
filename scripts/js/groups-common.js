/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global apiFailure:false, utils:false, apiUrl:false, initTable:false, updateFtlInfo:false */

var groups = [];

function populateGroupSelect(selectEl) {
  if (selectEl.length === 0) {
    // No select element found, return
    return;
  }

  // Add all known groups
  for (var i = 0; i < groups.length; i++) {
    var dataSub = "";
    if (!groups[i].enabled) {
      dataSub = 'data-subtext="(disabled)"';
    }

    selectEl.append(
      $("<option " + dataSub + "/>")
        .val(groups[i].id)
        .text(groups[i].name)
    );
  }

  // Initialize selectpicker
  selectEl.val([0]);

  // Refresh selectpicker
  selectEl.selectpicker("refresh");
}

// eslint-disable-next-line no-unused-vars
function getGroups(groupSelector) {
  $.ajax({
    url: apiUrl + "/groups",
    type: "GET",
    dataType: "json",
    success: function (data) {
      groups = data.groups;

      // Get all all <select> elements with the class "selectpicker"
      var groupSelector = $(".selectpicker");
      // Populate the groupSelector with the groups
      for (var i = 0; i < groupSelector.length; i++) {
        populateGroupSelect($(groupSelector[i]));
      }

      // Actually load table contents
      initTable();
    },
    error: function (data) {
      apiFailure(data);
    },
  });
}

// eslint-disable-next-line no-unused-vars
function processGroupResult(data, type, done, notDone) {
  // Loop over data.processed.success and show toasts
  data.processed.success.forEach(function (item) {
    utils.showAlert("success", "fas fa-pencil-alt", `Successfully ${done} ${type}`, item);
  });
  // Loop over errors and display them
  data.processed.errors.forEach(function (error) {
    console.log(error); // eslint-disable-line no-console
    utils.showAlert("error", "", `Error while ${notDone} ${type} ${error.item}`, error.error);
  });
}

// eslint-disable-next-line no-unused-vars
function delGroupItems(type, ids, table, listType = undefined) {
  // Check input validity
  if (!Array.isArray(ids)) return;

  const url = apiUrl + "/" + type + "s:batchDelete";

  // use utils.hexDecode() to decode all clients
  let idstring = "";
  for (var i = 0; i < ids.length; i++) {
    ids[i].item = utils.hexDecode(ids[i].item);
    idstring += ids[i].item + ", ";
  }

  // Remove last comma and space from idstring
  idstring = idstring.substring(0, idstring.length - 2);

  // Append "s" to type if more than one item is deleted
  type += ids.length > 1 ? "s" : "";

  // Prepend listType to type if it is not undefined
  if (listType !== undefined) {
    type = listType + " " + type;
  }

  utils.disableAll();
  utils.showAlert("info", "", "Deleting " + ids.length + " " + type + "...", idstring);

  $.ajax({
    url: url,
    data: JSON.stringify(ids),
    contentType: "application/json",
    method: "POST",
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "far fa-trash-alt", "Successfully deleted " + type, idstring);
      table.ajax.reload(null, false);

      // Clear selection after deletion
      table.rows().deselect();
      utils.changeBulkDeleteStates(table);

      // Update number of <type> items in the sidebar
      updateFtlInfo();
    })
    .fail(function (data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert("error", "", "Error while deleting " + type, data.responseText);
      console.log(exception); // eslint-disable-line no-console
    });
}
