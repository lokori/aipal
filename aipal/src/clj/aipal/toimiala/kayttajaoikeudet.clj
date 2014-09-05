(ns aipal.toimiala.kayttajaoikeudet
  "https://knowledge.solita.fi/pages/viewpage.action?pageId=61901330"
  (:require [aipal.toimiala.kayttajaroolit :refer :all]
            [oph.korma.korma-auth :as ka]
            [aipal.arkisto.kayttajaoikeus :as kayttajaoikeus-arkisto]
            [aipal.arkisto.kyselykerta :as kyselykerta-arkisto]))

(def ^:dynamic *current-user-authmap*)

(defn ->int
  "Merkkijono numeroksi tai numero sellaisenaan."
  [str-or-int]
  {:pre [(or (integer? str-or-int)
             (string? str-or-int))]
   :post [(integer? %)]}
  (if (string? str-or-int)
    (Integer/parseInt str-or-int)
    str-or-int))

(defn aipal-kayttaja?
  ([x] (aipal-kayttaja?))
  ([]
    true))

(defn sisaltaa-jonkin-rooleista? [roolit roolirivit]
  (not (empty? (clojure.set/select roolit (set (map :rooli roolirivit))))))

(defn kayttajalla-on-jokin-rooleista? [roolit]
  (sisaltaa-jonkin-rooleista? roolit (:roolit *current-user-authmap*)))

(defn kayttajalla-on-jokin-rooleista-kyselyssa? [roolit kyselyid]
  (sisaltaa-jonkin-rooleista? roolit
                              (kayttajaoikeus-arkisto/hae-kyselylla (->int kyselyid)
                                                                    @ka/*current-user-oid*)))

(defn yllapitaja? []
  (kayttajalla-on-jokin-rooleista?
    #{"YLLAPITAJA"}))

(defn kyselyiden-listaaminen?
  "Onko kyselyiden listaaminen sallittua yleisesti toimintona?"
  []
  (kayttajalla-on-jokin-rooleista?
    #{"YLLAPITAJA"
      "OPL-PAAKAYTTAJA"
      "OPL-VASTUUKAYTTAJA"
      "OPL-KAYTTAJA"
      "OPL-KATSELIJA"}))

(defn kysely-luonti? []
  (kayttajalla-on-jokin-rooleista?
    #{"YLLAPITAJA"
      "OPL-PAAKAYTTAJA"
      "OPL-VASTUUKAYTTAJA"
      "OPL-KAYTTAJA"}))

(defn kysely-muokkaus? [kyselyid]
  (or (yllapitaja?)
      (kayttajalla-on-jokin-rooleista-kyselyssa?
        #{"OPL-PAAKAYTTAJA"
          "OPL-VASTUUKAYTTAJA"
          "OPL-KAYTTAJA"}
        kyselyid)))

(defn kysely-luku? [kyselyid]
  (or (yllapitaja?)
      (kayttajalla-on-jokin-rooleista-kyselyssa?
        #{"OPL-PAAKAYTTAJA"
          "OPL-VASTUUKAYTTAJA"
          "OPL-KAYTTAJA"
          "OPL-KATSELIJA"}
        kyselyid)))

(defn kyselykerta-luku? [kyselykertaid]
  (let [kyselykerta (kyselykerta-arkisto/hae-yksi (->int kyselykertaid))]
    (kysely-luku? (:kyselyid kyselykerta))))

(def kayttajatoiminnot
  `{:logitus aipal-kayttaja?
    :kieli aipal-kayttaja?
    :vastaajatunnus aipal-kayttaja?
    :kysely kyselyiden-listaaminen?
    :kysely-luonti kysely-luonti?
    :kysely-luku kysely-luku?
    :kysely-muokkaus kysely-muokkaus?
    :kyselykerta-luku kyselykerta-luku?
    :kysymysryhma-luku aipal-kayttaja?
    :impersonointi yllapitaja?
    :kayttajan_tiedot aipal-kayttaja?
    :omat_tiedot aipal-kayttaja?})

(def toiminnot kayttajatoiminnot)
