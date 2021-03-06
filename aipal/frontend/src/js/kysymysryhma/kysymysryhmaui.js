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

angular.module('kysymysryhma.kysymysryhmaui', ['ngRoute',
                                               'ui.bootstrap',
                                               'rest.kysymysryhma',
                                               'yhteiset.palvelut.i18n',
                                               'yhteiset.palvelut.ilmoitus',
                                               'yhteiset.palvelut.kayttooikeudet',
                                               'yhteiset.palvelut.tallennusMuistutus',
                                               'yhteiset.palvelut.varmistus',
                                               'yhteiset.suodattimet.numerot'])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/kysymysryhmat', {
        controller: 'KysymysryhmatController',
        templateUrl: 'template/kysymysryhma/kysymysryhmat.html',
        label: 'i18n.kysymysryhma.kysymysryhmat'
      })
      .when('/kysymysryhmat/kysymysryhma/uusi', {
        controller: 'KysymysryhmaController',
        templateUrl: 'template/kysymysryhma/kysymysryhma.html',
        label: 'i18n.kysymysryhma.luo_uusi',
        resolve: {
          uusi: function() { return true; },
          kopioi: function() { return false; }
        }
      })
      .when('/kysymysryhmat/kysymysryhma/:kysymysryhmaid/kopioi', {
        controller: 'KysymysryhmaController',
        templateUrl: 'template/kysymysryhma/kysymysryhma.html',
        label: 'i18n.kysymysryhma.luo_uusi',
        resolve: {
          uusi: function() { return true; },
          kopioi: function() { return true; }
        }
      })
      .when('/kysymysryhmat/kysymysryhma/:kysymysryhmaid', {
        controller: 'KysymysryhmaController',
        templateUrl: 'template/kysymysryhma/kysymysryhma.html',
        label: 'i18n.kysymysryhma.muokkaa',
        resolve: {
          uusi: function() { return false; },
          kopioi: function() { return false; }
        }
      });
  }])

  .controller('KysymysryhmatController', ['$filter', '$scope', '$uibModal', 'Kysymysryhma',
                                          function($filter, $scope, $uibModal, Kysymysryhma) {
    $scope.latausValmis = false;
    Kysymysryhma.haeKaikki().success(function(kysymysryhmat){
      // angular-tablesort haluaa lajitella rivioliosta löytyvän (filtteröidyn)
      // attribuutin perusteella, mutta lokalisoitujen kenttien kanssa täytyy
      // antaa filtterille koko rivi. Lisätään riviolioon viittaus itseensä,
      // jolloin voidaan kertoa angular-tablesortille attribuutti, josta koko
      // rivi löytyy.
      $scope.kysymysryhmat = _.map(kysymysryhmat, function(k){
        return _.assign(k, {self: k});
      });
      $scope.latausValmis = true;
    }).error(function() {
      $scope.latausValmis = true;
    });
  }])

  .factory('kysymysApurit', [function() {
    var uusiVaihtoehto = function() {
      return {
        teksti_fi: '',
        teksti_sv: ''
      };
    };
    return {
      uusiKysymys: function() {
        return {
          uusi: true, // Jos on uusi, eikä muokkaus
          kysymys_fi: '',
          kysymys_sv: '',
          pakollinen: true,
          poistettava: false,
          poistetaan_kysymysryhmasta: false,
          vastaustyyppi: 'likert_asteikko',
          muokattava: true,
          jatkokysymys: {max_vastaus: 500},
          max_vastaus: 500,
          monivalinta_max: 1,
          monivalintavaihtoehdot: [uusiVaihtoehto(), uusiVaihtoehto()]
        };
      },
      poistaYlimaaraisetKentat: function(kysymys) {
        if (kysymys.jatkokysymys !== undefined) {
          if (!kysymys.jatkokysymys.kylla_jatkokysymys && !kysymys.jatkokysymys.ei_jatkokysymys) {
            delete kysymys.jatkokysymys;
          }
          else {
            if (!kysymys.jatkokysymys.kylla_jatkokysymys) {
              delete kysymys.jatkokysymys.kylla_teksti_fi;
              delete kysymys.jatkokysymys.kylla_teksti_sv;
              delete kysymys.jatkokysymys.kylla_jatkokysymys;
            }
            if (!kysymys.jatkokysymys.ei_jatkokysymys) {
              delete kysymys.jatkokysymys.ei_teksti_fi;
              delete kysymys.jatkokysymys.ei_teksti_sv;
              delete kysymys.jatkokysymys.max_vastaus;
              delete kysymys.jatkokysymys.ei_jatkokysymys;
            }
          }
        }
        if (kysymys.vastaustyyppi !== 'vapaateksti') {
          delete kysymys.max_vastaus;
        }
        if (kysymys.vastaustyyppi !== 'monivalinta') {
          delete kysymys.monivalintavaihtoehdot;
          delete kysymys.monivalinta_max;
        }
      },
      uusiVaihtoehto: uusiVaihtoehto,
      poistaVaihtoehto: function(kysymys, index) {
        kysymys.monivalintavaihtoehdot.splice(index,1);
        if (kysymys.monivalinta_max > kysymys.monivalintavaihtoehdot.length) {
          kysymys.monivalinta_max = kysymys.monivalintavaihtoehdot.length;
        }
      }
    };
  }])

  .controller('KysymysryhmaController', ['$uibModal', '$routeParams', '$scope', '$location', 'Kysymysryhma', 'i18n', 'ilmoitus', 'kysymysApurit', 'tallennusMuistutus', 'uusi', 'kopioi', 'kayttooikeudet', function($uibModal, $routeParams, $scope, $location, Kysymysryhma, i18n, ilmoitus, apu, tallennusMuistutus, uusi, kopioi, kayttooikeudet) {
    $scope.$watch('form', function(form) {
      tallennusMuistutus.muistutaTallennuksestaPoistuttaessaFormilta(form);
    });

    $scope.uusi = uusi;

    $scope.kysymysryhma = {
      kysymykset: [],
      ntm_kysymykset: kayttooikeudet.isNtmVastuuKayttaja()
    };
    if (kopioi || !uusi) {
      Kysymysryhma.hae($routeParams.kysymysryhmaid)
        .success(function(kysymysryhma) {
          if (kopioi) {
            delete kysymysryhma.kysymysryhmaid;
            // Poistetaan asteikko-tyyppiset kysymykset
            var kysymystenMaara = kysymysryhma.kysymykset.length;
            kysymysryhma.kysymykset = _.filter(kysymysryhma.kysymykset, function(k) {
              return k.vastaustyyppi !== 'asteikko';
            });
            if (kysymystenMaara > kysymysryhma.kysymykset.length) {
              ilmoitus.varoitus(i18n.hae('kysymysryhma.asteikkokysymyksen_kopiointi'));
            }
            // Poistetaan asteikko-tyyppiset jatkokysymykset
            var alkuperaisetJatkokysymykset = _.map(kysymysryhma.kysymykset, 'jatkokysymys');
            kysymysryhma.kysymykset = _.map(kysymysryhma.kysymykset, function(k){
              if (k.jatkokysymys && k.jatkokysymys.kylla_vastaustyyppi === 'asteikko') {
                var k2 = _.clone(k);
                delete k2.jatkokysymys;
                return k2;
              } else {
                return k;
              }
            });
            var suodatetutJatkokysymykset = _.map(kysymysryhma.kysymykset, 'jatkokysymys');
            if (!_.isEqual(suodatetutJatkokysymykset, alkuperaisetJatkokysymykset)) {
              ilmoitus.varoitus(i18n.hae('kysymysryhma.asteikkojatkokysymyksen_kopiointi'));
            }
          }
          $scope.kysymysryhma = kysymysryhma;
        })
        .error(function(data, status) {
          if (status !== 500) {
            $location.url('/kysymysryhmat');
          }
        });
    }

    $scope.muokkaustila = false;
    $scope.vastaustyypit = [
      'arvosana',
      'kylla_ei_valinta',
      'likert_asteikko',
      'monivalinta',
      'vapaateksti'
    ];
    $scope.vapaateksti_maksimit = [500,1000,1500,2000,2500,3000];

    $scope.lisaaKysymys = function() {
      $scope.kysymysryhma.kysymykset.push(apu.uusiKysymys());
      $scope.aktiivinenKysymys = $scope.kysymysryhma.kysymykset[$scope.kysymysryhma.kysymykset.length-1];
      $scope.muokkaustila = true;
    };

    $scope.lisaaVaihtoehto = function() {
      $scope.aktiivinenKysymys.monivalintavaihtoehdot.push(apu.uusiVaihtoehto());
    };
    $scope.poistaVaihtoehto = apu.poistaVaihtoehto;
    $scope.tallenna = function() {
      apu.poistaYlimaaraisetKentat($scope.aktiivinenKysymys);
      $scope.aktiivinenKysymys.muokattava = false;
      $scope.aktiivinenKysymys.uusi = false;
      $scope.muokkaustila = false;
    };

    $scope.peruutaKysymysTallennus = function(){
      $scope.aktiivinenKysymys.muokattava = false;
      $scope.muokkaustila = false;

      if(!$scope.aktiivinenKysymys.uusi ){
        $scope.kysymysryhma.kysymykset = originals;
      }
      // Uudet "tyhjät" pois jos painetaan peruuta
      $scope.kysymysryhma.kysymykset = _.filter(
        $scope.kysymysryhma.kysymykset,
        function(kysymys) {return !kysymys.uusi;}
      );
    };

    $scope.peruuta = function(){
      $location.path('/kysymysryhmat');
    };

    function luoUusiKysymysryhma(){
      Kysymysryhma.luoUusi($scope.kysymysryhma)
      .success(function(){
        $scope.form.$setPristine();
        $location.path('/kysymysryhmat');
        ilmoitus.onnistuminen(i18n.hae('kysymysryhma.luonti_onnistui'));
      })
      .error(function(){
        ilmoitus.virhe(i18n.hae('kysymysryhma.luonti_epaonnistui'));
      });
    }

    function tallennaKysymysryhma() {
      Kysymysryhma.tallenna($scope.kysymysryhma)
      .success(function(){
        $scope.form.$setPristine();
        $location.path('/kysymysryhmat');
        ilmoitus.onnistuminen(i18n.hae('kysymysryhma.tallennus_onnistui'));
      })
      .error(function(){
        ilmoitus.virhe(i18n.hae('kysymysryhma.tallennus_epaonnistui'));
      });
    }

    $scope.tallennaKysymysryhma = function() {
      $scope.poistaKysymykset();
      if (uusi) {
        luoUusiKysymysryhma();
      } else {
        tallennaKysymysryhma();
      }
    };

    $scope.naytaRakenneModal = function() {
      $uibModal.open({
        templateUrl: 'template/kysymysryhma/rakenne.html',
        controller: 'KysymysryhmaRakenneModalController',
        resolve: {
          kysymysryhma: function() { return $scope.kysymysryhma; }
        }
      });
    };

    var originals = {};
    $scope.muokkaa = function(kysymys) {
      originals = angular.copy($scope.kysymysryhma.kysymykset);
      kysymys.muokattava = true;

      if (_.isUndefined(kysymys.jatkokysymys) || _.isUndefined(kysymys.jatkokysymys.max_vastaus)) {
        _.merge(kysymys, {jatkokysymys: {max_vastaus: 500}});
      }
      $scope.aktiivinenKysymys = kysymys;
      $scope.muokkaustila = true;
    };

    $scope.poistaTahiPalautaKysymys = function(kysymys) {
      kysymys.poistetaan_kysymysryhmasta = !kysymys.poistetaan_kysymysryhmasta;
    };

    $scope.poistaKysymykset = function(){
      $scope.kysymysryhma.kysymykset = _.reject($scope.kysymysryhma.kysymykset, 'poistetaan_kysymysryhmasta');
    };

    function sisaltaaAsteikkokysymyksen(){
      return _.any($scope.kysymysryhma.kysymykset, function(k){
        return k.vastaustyyppi === 'asteikko';
      });
    }

    function onValidiNtmKysymysryhma() {
      return !kayttooikeudet.isNtmVastuuKayttaja() ||
        !!$scope.kysymysryhma.ntm_kysymykset;
    }

    $scope.tallennusSallittu = function() {
      return $scope.form.$valid &&
        !$scope.muokkaustila &&
        !sisaltaaAsteikkokysymyksen() &&
        onValidiNtmKysymysryhma();
    };
  }])

  .controller('KysymysryhmaRakenneModalController', ['$uibModalInstance', '$scope', 'kysymysryhma', function($uibModalInstance, $scope, kysymysryhma) {
    $scope.kysymysryhma = kysymysryhma;

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  }]);
