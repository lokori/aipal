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

angular.module('rest.kysely', ['ngResource'])
  .factory('Kysely', ['$resource', function($resource) {
    var resource = $resource(null, null, {
      haku: {
        method: 'GET',
        isArray: true,
        url: 'api/kysely',
        params: {
          nocache: function() {return Date.now();}
        },
        id: 'kyselylistaus'
      },
      idHaku: {
        method: 'GET',
        url: 'api/kysely/:id'
      },
      luoUusi: {
        method: 'POST',
        url: 'api/kysely'
      },
      tallenna: {
        method: 'POST',
        url: 'api/kysely/:id'
      },
      lisaaKyselypohja: {
        method: 'POST',
        url: 'api/kysely/:kyselyId/lisaa-kyselypohja/:kyselypohjaId'
      },
      poistaKysymys: {
        method: 'DELETE',
        url: 'api/kysely/:kyselyId/poista-kysymys/:kysymysId'
      },
      palautaKysymys: {
        method: 'POST',
        url: 'api/kysely/:kyselyId/palauta-kysymys/:kysymysId'
      }
    });

    return {
      hae: function(successCallback, errorCallback) {
        return resource.haku({}, successCallback, errorCallback);
      },
      haeId: function(id, successCallback, errorCallback) {
        return resource.idHaku({id: id}, successCallback, errorCallback);
      },
      luoUusi: function(successCallback, errorCallback) {
        return resource.luoUusi({}, {}, successCallback, errorCallback);
      },
      tallenna: function(data, successCallback, errorCallback) {
        return resource.tallenna({id: data.kyselyid}, data, successCallback, errorCallback);
      },
      lisaaKyselypohja: function(kyselyId, kyselypohjaId, successCallback, errorCallback) {
        return resource.lisaaKyselypohja({kyselyId: kyselyId, kyselypohjaId: kyselypohjaId}, {}, successCallback, errorCallback);
      },
      poistaKysymys: function(kyselyId, kysymysId, successCallback, errorCallback) {
        return resource.poistaKysymys({kyselyId: kyselyId, kysymysId: kysymysId}, {}, successCallback, errorCallback);
      },
      palautaKysymys: function(kyselyId, kysymysId, successCallback, errorCallback) {
        return resource.palautaKysymys({kyselyId: kyselyId, kysymysId: kysymysId}, {}, successCallback, errorCallback);
      }
    };
  }]);
