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

angular.module('kyselykerta.kyselykertaui', ['yhteiset.palvelut.i18n', 'ngRoute', 'rest.rahoitusmuoto', 'rest.vastaajatunnus', 'rest.kyselykerta', 'yhteiset.palvelut.ilmoitus'])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/kyselyt/:kyselyid/kyselykerta/uusi', {
        controller: 'KyselykertaController',
        templateUrl: 'template/kyselykerta/kyselykerta.html',
        label: 'i18n.kysely.breadcrumb_uusi_kyselykerta',
        resolve: {
          uusi: function() { return true; }
        }
      })
      .when('/kyselyt/:kyselyid/kyselykerta/:kyselykertaid', {
        controller: 'KyselykertaController',
        templateUrl: 'template/kyselykerta/kyselykerta.html',
        label: 'i18n.kysely.breadcrumb_muokkaa_kyselykertaa',
        resolve: {
          uusi: function() { return false; }
        }
      });
  }])

  .controller('KyselykertaController', ['Kyselykerta', 'Kysely', 'Rahoitusmuoto', 'Vastaajatunnus', 'tallennusMuistutus', '$location', '$modal', '$routeParams', '$scope', 'ilmoitus', 'i18n', 'uusi',
    function(Kyselykerta, Kysely, Rahoitusmuoto, Vastaajatunnus, tallennusMuistutus, $location, $modal, $routeParams, $scope, ilmoitus, i18n, uusi) {
      $scope.$watch('kyselykertaForm', function(form) {
        // watch tarvitaan koska form asetetaan vasta controllerin jälkeen
        tallennusMuistutus.muistutaTallennuksestaPoistuttaessaFormilta(form);
      });
      $scope.luoTunnuksiaDialogi = function() {
        var kyselykertaId = $routeParams.kyselykertaid;

        var modalInstance = $modal.open({
          templateUrl: 'template/kysely/tunnusten-luonti.html',
          controller: 'LuoTunnuksiaModalController',
          resolve: {
            rahoitusmuodot: function() {
              return $scope.rahoitusmuodot;
            }
          }
        });

        modalInstance.result.then(function(vastaajatunnus) {
          Vastaajatunnus.luoUusia(kyselykertaId, vastaajatunnus, function(uudetTunnukset) {
            _.forEach(uudetTunnukset, function(tunnus) {
              tunnus.new = true;
              $scope.tunnukset.unshift(tunnus);
            });
            ilmoitus.onnistuminen(i18n.hae('vastaajatunnus.tallennus_onnistui'));
          }, function() {
            ilmoitus.virhe(i18n.hae('vastaajatunnus.tallennus_epaonnistui'));
          });
        });
      };

      $scope.uusi = uusi;
      $scope.kyselykertaid = $routeParams.kyselykertaid;
      $scope.rahoitusmuodot = Rahoitusmuoto.haeKaikki(function(data) {
        $scope.rahoitusmuodotmap = _.indexBy(data, 'rahoitusmuotoid');
      });

      $scope.tunnukset = [];
      $scope.kyselykerta = {};
      $scope.kysely = {};
      Kysely.haeId($routeParams.kyselyid).success(function(kysely) {
        $scope.kysely = kysely;
      }).error(function() {
        $location.url('/');
      });

      if (!$scope.uusi) {
        $scope.tunnukset = Vastaajatunnus.hae($routeParams.kyselykertaid);
        Kyselykerta.haeYksi($scope.kyselykertaid)
          .success(function(kyselykerta) {
            $scope.kyselykerta = kyselykerta;
          })
          .error(function() {
            $location.url('/');
          });
      }

      $scope.getVastaustenLkm = function(rahoitusmuotoid){
        if(!rahoitusmuotoid) {
          return _($scope.tunnukset).map('vastausten_lkm').reduce(function (sum, num) {return sum + num;});
        }
        return _($scope.tunnukset).filter({ 'rahoitusmuotoid': rahoitusmuotoid }).map('vastausten_lkm').reduce(function(sum, num) {return sum + num;});
      };
      $scope.getVastaajienLkm = function(rahoitusmuotoid){
        if(!rahoitusmuotoid) {
          return _($scope.tunnukset).map('vastaajien_lkm').reduce(function (sum, num) {return sum + num;});
        }
        return _($scope.tunnukset).filter({ 'rahoitusmuotoid': rahoitusmuotoid }).map('vastaajien_lkm').reduce(function(sum, num) {return sum + num;});
      };
      $scope.getVastausProsentti = function(rahoitusmuotoid){
        if(!rahoitusmuotoid) {
          return ($scope.getVastaustenLkm() / $scope.getVastaajienLkm()) * 100;
        }
        return ($scope.getVastaustenLkm(rahoitusmuotoid) / $scope.getVastaajienLkm(rahoitusmuotoid))*100;
      };

      $scope.tallenna = function() {
        if ($scope.uusi) {
          Kyselykerta.luoUusi(parseInt($routeParams.kyselyid, 10), $scope.kyselykerta)
            .success(function(kyselykerta) {
              $scope.kyselykertaForm.$setPristine();
              $location.url('/kyselyt/' + $routeParams.kyselyid + '/kyselykerta/' + kyselykerta.kyselykertaid);
            });
        } else {
          Kyselykerta.tallenna($scope.kyselykertaid, $scope.kyselykerta)
            .success(function() {
              $scope.kyselykertaForm.$setPristine();
              ilmoitus.onnistuminen(i18n.hae('kyselykerta.tallennus_onnistui'));
            })
            .error(function() {
              ilmoitus.virhe(i18n.hae('kyselykerta.tallennus_epaonnistui'));
            });
        }
      };

      $scope.lukitseTunnus = function(tunnus, lukitse) {
        Vastaajatunnus.lukitse($routeParams.kyselykertaid, tunnus.vastaajatunnusid, lukitse, function(uusiTunnus) {
          _.assign(tunnus, uusiTunnus);
        });
      };
    }]
  )

  .controller('LuoTunnuksiaModalController', ['$modalInstance', '$scope', 'rahoitusmuodot', function($modalInstance, $scope, rahoitusmuodot) {
    $scope.vastaajatunnus = {
      vastaajien_lkm: 1
    };
    $scope.rahoitusmuodot = rahoitusmuodot;

    $scope.luoTunnuksia = function(vastaajatunnus) {
      $modalInstance.close(vastaajatunnus);
    };
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }])
;