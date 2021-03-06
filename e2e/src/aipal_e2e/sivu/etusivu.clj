;; Copyright (c) 2014 The Finnish National Board of Education - Opetushallitus
;;
;; This program is free software:  Licensed under the EUPL, Version 1.1 or - as
;; soon as they will be approved by the European Commission - subsequent versions
;; of the EUPL (the "Licence");
;;
;; You may not use this work except in compliance with the Licence.
;; You may obtain a copy of the Licence at: http://www.osor.eu/eupl/
;;
;; This program is distributed in the hope that it will be useful,
;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;; European Union Public Licence for more details.

(ns aipal-e2e.sivu.etusivu
  (:require [clj-webdriver.taxi :as w]
            [clj-webdriver.core :as webdriver]
            [aipal-e2e.util :refer :all]
            [aitu-e2e.util :refer [odota-angular-pyyntoa odota-kunnes]]))

(defn avaa-sivu []
  (avaa "/#/"))

(defn valitse-rooli [index]
  (avaa-sivu)
  (w/click {:css ".avaa-valikko-e2e"})
  (w/click {:css ".vaihda-roolia-e2e"})
  (w/select-option {:css ".rooli-select-e2e"} {:index index})
  (odota-angular-pyyntoa)
  (w/click {:css ".tallenna-rooli-e2e"})
  (odota-angular-pyyntoa))
