// Copyright (c) 2014 The Finnish National Board of Education - Opetushallitus
//
// This program is free software:  Licensed under the EUPL, Version 1.1 or - as
// soon as they will be approved by the European Commission - subsequent versions
// of the EUPL (the "Licence");
//
// You may not use this work except in compliance with the Licence.
// You may obtain a copy of the Licence at: http://www.osor.eu/eupl/
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// European Union Public Licence for more details.

'use strict';

angular.module('toimiala.vastaus', ['ngResource'])
  .factory('Vastaus', ['$resource', function($resource) {
    var resource = $resource(null, null, {
      tallenna: {
        method: 'POST',
        url: 'api/vastaus/:tunnus'
      },
      luoVastaaja: {
        method: 'POST',
        url: 'api/vastaaja/luo'
      }
    });

    return {
      tallenna: function(tunnus, vastaajaid, data, successCallback, errorCallback) {
        data.vastaajaid = vastaajaid;
        return resource.tallenna({tunnus: tunnus}, data, successCallback, errorCallback);
      },
      luoVastaaja: function(tunnus, successCallback, errorCallback) {
        return resource.luoVastaaja({}, {tunnus: tunnus}, successCallback, errorCallback);
      }
    };
  }]);