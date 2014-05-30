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

angular.module('raportti.kyselykerta.kaavioapurit', [])
  .factory('kaavioApurit', [function() {
    var varit = ['#43b1d5', '#ffad33', '#d633ad', '#6cc555'];

    var lukumaaratYhteensa = function (jakauma) {
      var lukumaarat = _.pluck(jakauma, 'lukumaara');
      return _.reduce(lukumaarat, function (sum, n) {return sum + n;});
    };

    return {
      jaaTeksti: function (teksti) {
        var sanat = teksti.split(/\s/);
        var sanojaPerRivi = Math.ceil(sanat.length / 2);

        var rivit = [];
        while (sanat.length > 0) {
          rivit.push(sanat.splice(0, sanojaPerRivi).join(' '));
        }
        return rivit;
      },

      maksimi: function (jakauma) {
        var lukumaarat = _.pluck(jakauma, 'lukumaara');
        return _.max(lukumaarat);
      },

      otsikoilleTilaa: function (asetukset, jakauma) {
        var vaihtoehdot = _.pluck(jakauma, 'vaihtoehto');
        var pituudet = _.map(vaihtoehdot, function (v) {return v.length;});
        return asetukset.maksimitilaOtsikolle *
          _.max(pituudet) / asetukset.tekstinMaksimiPituus +
          asetukset.otsikoidenSisennys;
      },

      lukumaaratYhteensa: lukumaaratYhteensa,

      palkinPituus: function (asetukset, lukumaara, jakauma) {
        var yhteensa = lukumaaratYhteensa(jakauma);
        if (Math.abs(yhteensa) > 0.01) {
          return asetukset.palkinMaksimiPituus * (lukumaara / yhteensa);
        } else {
          return 0;
        }
      },

      palkinVari: function (i) {
        return varit[i % varit.length];
      },
    };
  }]);