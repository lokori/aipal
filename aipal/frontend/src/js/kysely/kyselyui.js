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

angular.module('kysely.kyselyui', ['rest.kysely', 'rest.kyselypohja',
                                   'rest.vastaajatunnus', 'yhteiset.palvelut.i18n',
                                   'ngAnimate', 'ngRoute', 'yhteiset.palvelut.ilmoitus',
                                   'yhteiset.palvelut.tallennusMuistutus',
                                   'rest.kysymysryhma'])

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/kyselyt', {
        controller: 'KyselytController',
        templateUrl: 'template/kysely/kyselyt.html',
        label: 'i18n.kysely.breadcrumb_kyselyt'
      })
      .when('/kyselyt/kysely/uusi', {
        controller: 'KyselyController',
        templateUrl: 'template/kysely/kysely.html',
        label: 'i18n.kysely.breadcrumb_uusi_kysely',
        resolve: {
          kopioi: function() { return false; }
        }
      })
      .when('/kyselyt/kysely/:kyselyid', {
        controller: 'KyselyController',
        templateUrl: 'template/kysely/kysely.html',
        label: 'i18n.kysely.breadcrumb_muokkaa_kyselya',
        resolve: {
          kopioi: function() { return false; }
        }
      })
      .when('/kyselyt/kysely/:kyselyid/kopioi', {
        controller: 'KyselyController',
        templateUrl: 'template/kysely/kysely.html',
        label: 'i18n.kysely.breadcrumb_kopioi_kysely',
        resolve: {
          kopioi: function() { return true; }
        }
      });
  }])

  .controller('KyselytController', [
    '$location', '$modal', '$scope', 'ilmoitus', 'Kysely', 'Kyselykerta', 'i18n', 'seuranta',
    function ($location, $modal, $scope, ilmoitus, Kysely, Kyselykerta, i18n, seuranta) {
      $scope.naytaLuonti = false;

      $scope.status = {};

      $scope.luoUusiKysely = function () {
        $location.url('/kyselyt/kysely/uusi');
      };

      var avaaMuistetutKyselyt = function() {
        var avoimetKyselyIdt = JSON.parse(sessionStorage.getItem('avoimetKyselyt'));
        _.forEach(avoimetKyselyIdt, function(kyselyId) {
          var kysely = _.find($scope.kyselyt, {kyselyid: kyselyId});
          if (kysely !== undefined) {
            kysely.open = true;
          }
        });
      };

      var muistaAvattavatKyselyt = function() {
        $scope.$watch('kyselyt', function(kyselyt) {
          var avoimetKyselyIdt = _(kyselyt).filter('open').map('kyselyid').value();
          sessionStorage.setItem('avoimetKyselyt', JSON.stringify(avoimetKyselyIdt));
        }, true);
      };

      $scope.haeKyselyt = function () {
        seuranta.asetaLatausIndikaattori(Kysely.hae(), 'kyselylistaus')
        .success(function (data) {
          $scope.kyselyt = data;
          avaaMuistetutKyselyt();
          muistaAvattavatKyselyt();
        })
        .error(function() {
          ilmoitus.virhe(i18n.hae('yleiset.lataus_epaonnistui'));
        });
      };
      $scope.haeKyselyt();
    }
  ])

  .factory('kyselyApurit', [function() {
    return {
      lisaaUniikitKysymysryhmatKyselyyn: function(kysely, uudet) {
        _.assign(kysely, { kysymysryhmat: _(kysely.kysymysryhmat.concat(uudet)).uniq('kysymysryhmaid').value() });
      }
    };
  }])

  .controller('KyselyController', [
    'Kysely', 'Kyselypohja', 'Kysymysryhma', 'kyselyApurit', 'i18n', 'tallennusMuistutus', '$routeParams', '$route', '$scope', 'ilmoitus', '$location', '$modal', 'seuranta', 'kopioi',
    function (Kysely, Kyselypohja, Kysymysryhma, apu, i18n, tallennusMuistutus, $routeParams, $route, $scope, ilmoitus, $location, $modal, seuranta, kopioi) {
      var tallennusFn;
      $scope.$watch('kyselyForm', function(form) {
        // watch tarvitaan koska form asetetaan vasta controllerin jälkeen
        tallennusMuistutus.muistutaTallennuksestaPoistuttaessaFormilta(form);
      });

      if ($routeParams.kyselyid) {
        Kysely.haeId($routeParams.kyselyid)
          .success(function(kysely) {
            $scope.kysely = kysely;
            if(kopioi) {
              tallennusFn = Kysely.luoUusi;
              $scope.kysely.tila = 'luonnos';
              delete $scope.kysely.kyselyid;
            } else {
              tallennusFn = Kysely.tallenna;
            }
          })
          .error(function() {
            ilmoitus.virhe(i18n.hae('yleiset.lataus_epaonnistui'));
          });
      }
      else {
        $scope.kysely = {
          kysymysryhmat: [],
          voimassa_alkupvm: new Date().toISOString().slice(0, 10)
        };
        tallennusFn = Kysely.luoUusi;
      }

      $scope.tallenna = function () {
        seuranta.asetaLatausIndikaattori(tallennusFn($scope.kysely), 'kyselynTallennus')
        .success(function () {
          $scope.kyselyForm.$setPristine();
          $location.path('/kyselyt');
          ilmoitus.onnistuminen(i18n.hae('kysely.tallennus_onnistui'));
        })
        .error(function () {
          ilmoitus.virhe(i18n.hae('kysely.tallennus_epaonnistui'));
        });
      };

      $scope.peruuta = function() {
        $location.path('/kyselyt');
      };

      $scope.lisaaKyselypohjaModal = function () {
        var modalInstance = $modal.open({
          templateUrl: 'template/kysely/lisaa-kyselypohja.html',
          controller: 'LisaaKyselypohjaModalController'
        });
        modalInstance.result.then(function (kyselypohjaId) {
          Kyselypohja.haeKysymysryhmat(kyselypohjaId)
          .success(function(kysymysryhmat) {
            apu.lisaaUniikitKysymysryhmatKyselyyn($scope.kysely, kysymysryhmat);
            $scope.kyselyForm.$setDirty();
          })
          .error(function(){
            ilmoitus.virhe(i18n.hae('kysely.pohjan_haku_epaonnistui'));
          });
        });
      };

      $scope.lisaaKysymysryhmaModal = function() {
        var modalInstance = $modal.open({
          templateUrl: 'template/kysely/lisaa-kysymysryhma.html',
          controller: 'LisaaKysymysryhmaModalController'
        });
        modalInstance.result.then(function (kysymysryhmaid) {
          Kysymysryhma.hae(kysymysryhmaid)
          .success(function(kysymysryhma) {
            apu.lisaaUniikitKysymysryhmatKyselyyn($scope.kysely, kysymysryhma);
            $scope.kyselyForm.$setDirty();
          })
          .error(function() {
            ilmoitus.virhe(i18n.hae('kysely.ryhman_haku_epaonnistui'));
          });
        });
      };

      $scope.poistaKysymys = function (kysymys) {
        kysymys.poistettu = true;
      };
      $scope.palautaKysymys = function (kysymys) {
        kysymys.poistettu = false;
      };
    }
  ])

  .controller('LisaaKyselypohjaModalController', ['$modalInstance', '$scope', 'Kyselypohja', function ($modalInstance, $scope, Kyselypohja) {
    Kyselypohja.haeVoimassaolevat()
    .success(function (data) {
      $scope.kyselypohjat = data;
    });
    $scope.tallenna = function (kyselypohjaId) {
      $modalInstance.close(kyselypohjaId);
    };
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }])

  .controller('LisaaKysymysryhmaModalController', ['$modalInstance', '$scope', 'Kysymysryhma', function ($modalInstance, $scope, Kysymysryhma) {
    Kysymysryhma.haeVoimassaolevat().success(function(kysymysryhmat){
      $scope.kysymysryhmat = kysymysryhmat;
    });
    $scope.tallenna = function (kysymysryhmaid) {
      $modalInstance.close(kysymysryhmaid);
    };
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }])
;
