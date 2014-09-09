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

describe('yhteiset.palvelut.i18n', function(){

  var i18nHae;

  beforeEach(module('yhteiset.palvelut.i18n'));

  beforeEach(inject(function(_i18nHae_){
    i18nHae = _i18nHae_;
  }));

  describe('i18nHae', function(){
    it('etsii käännösavaimen arvon this-oliosta', function(){
      var i18n = {foo: 'bar', hae: i18nHae};
      expect(i18n.hae('foo')).toEqual('bar');
    });

    it('palauttaa undefined tuntemattomille avaimille', function(){
      var i18n = {foo: 'bar', hae: i18nHae};
      expect(i18n.hae('baz')).toBe(undefined);
    });

    it('etsii arvot pisteellisille avaimille sisäkkäisistä olioista', function(){
      var i18n = {foo: {bar: 'baz'}, hae: i18nHae};
      expect(i18n.hae('foo.bar')).toEqual('baz');
    });

    it('palauttaa undefined tuntemattomille väliavaimille', function(){
      var i18n = {foo: {bar: {baz: 'xyz'}}, hae: i18nHae};
      expect(i18n.hae('foo.asdf.baz')).toBe(undefined);
    });
  });

});
