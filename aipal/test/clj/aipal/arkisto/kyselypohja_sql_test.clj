(ns aipal.arkisto.kyselypohja-sql-test
  (:require [clojure.test :refer :all]
            [korma.core :as sql]
            [clj-time.core :as time]
            [aipal.sql.test-util :refer [tietokanta-fixture]]
            [aipal.integraatio.sql.korma :refer [kyselypohja]]
            [aipal.arkisto.kyselypohja :refer :all]
            [aipal.sql.test-data-util :refer :all]))

(use-fixtures :each tietokanta-fixture)

;; hae-kyselypohjat palauttaa kaikki kyselypohjat riippumatta voimassaolosta
(deftest ^:integraatio hae-kyselypohjat-voimassaolo
  (let [koulutustoimija (lisaa-koulutustoimija!)]
    (sql/insert kyselypohja (sql/values [{:nimi_fi "a"
                                          :tila "julkaistu"
                                          :voimassa_alkupvm (time/local-date 1900 1 1)
                                          :voimassa_loppupvm (time/local-date 2000 1 1)
                                          :koulutustoimija (:ytunnus koulutustoimija)}
                                         {:nimi_fi "b"
                                          :tila "julkaistu"
                                          :voimassa_alkupvm (time/local-date 2000 1 1)
                                          :voimassa_loppupvm (time/local-date 2100 1 1)
                                          :koulutustoimija (:ytunnus koulutustoimija)}
                                         {:nimi_fi "c"
                                          :tila "julkaistu"
                                          :voimassa_alkupvm (time/local-date 2100 1 1)
                                          :voimassa_loppupvm (time/local-date 2200 1 1)
                                          :koulutustoimija (:ytunnus koulutustoimija)}]))
    (is (= #{"a" "b" "c"} (set (map :nimi_fi (hae-kyselypohjat (:ytunnus koulutustoimija))))))
    (is (= #{"b"} (set (map :nimi_fi (hae-kyselypohjat (:ytunnus koulutustoimija) true)))))))

(deftest ^:integraatio hae-kyselypohjat-oma-organisaatio
  (let [oma-koulutustoimija (lisaa-koulutustoimija! {:ytunnus "1111111-1"})
        muu-koulutustoimija (lisaa-koulutustoimija! {:ytunnus "2222222-2"})]
    (sql/insert kyselypohja (sql/values [{:nimi_fi "a"
                                          :koulutustoimija (:ytunnus oma-koulutustoimija)}
                                         {:nimi_fi "b"
                                          :koulutustoimija (:ytunnus muu-koulutustoimija)}
                                         {:nimi_fi "c"
                                          :koulutustoimija (:ytunnus oma-koulutustoimija)}]))
    (is (= #{"a" "c"} (set (map :nimi_fi (hae-kyselypohjat (:ytunnus oma-koulutustoimija))))))))

(deftest ^:integraatio hae-kyselypohjat-valtakunnalliset
  (let [koulutustoimija (lisaa-koulutustoimija!)]
    (sql/insert kyselypohja (sql/values [{:nimi_fi "a"
                                          :valtakunnallinen true
                                          :tila "julkaistu"}
                                         {:nimi_fi "b"
                                          :valtakunnallinen true
                                          :tila "julkaistu"}]))
    (is (= #{"a" "b"} (set (map :nimi_fi (hae-kyselypohjat (:ytunnus koulutustoimija))))))))

(deftest ^:integraatio hae-kyselypohjat-ntm-kyselypohja
  (let [opetushallitus        (lisaa-koulutustoimija! {:ytunnus "1234567-8"})
        kysymysryhma          (lisaa-kysymysryhma! {:ntm_kysymykset true
                                                    :taustakysymykset false
                                                    :tila "julkaistu"
                                                    :valtakunnallinen true}
                                                   opetushallitus)
        kyselypohja           (lisaa-kyselypohja! {:nimi_fi "NTM-kyselypohja"
                                                   :tila "julkaistu"
                                                   :valtakunnallinen true}
                                                  opetushallitus)
        {:keys [ytunnus]}     (lisaa-koulutustoimija! {:ytunnus "8765432-1"})
        sisaltaa-kyselypohjan (fn [kyselypohjat kyselypohjaid]
                                (some #{kyselypohjaid}
                                      (map :kyselypohjaid kyselypohjat)))]
    (sql/insert :kysymysryhma_kyselypohja (sql/values [{:kysymysryhmaid (:kysymysryhmaid kysymysryhma)
                                                        :kyselypohjaid (:kyselypohjaid kyselypohja)
                                                        :jarjestys 1}]))
    (testing
      "pääkäyttäjä näkee NTM-kyselypohjat"
      (with-redefs [aipal.infra.kayttaja/yllapitaja? (constantly true)]
        (is (sisaltaa-kyselypohjan (hae-kyselypohjat ytunnus)
                                   (:kyselypohjaid kyselypohja)))))
    (testing
      "NTM-vastuukäyttäjä näkee NTM-kyselypohjan"
      (with-redefs [aipal.infra.kayttaja/yllapitaja? (constantly false)
                    aipal.infra.kayttaja/ntm-vastuukayttaja? (constantly true)]
        (is (sisaltaa-kyselypohjan (hae-kyselypohjat ytunnus)
                                   (:kyselypohjaid kyselypohja)))))
    (testing
      "tavallinen käyttäjä ei näe NTM-kyselypohjia"
      (with-redefs [aipal.infra.kayttaja/yllapitaja? (constantly false)
                    aipal.infra.kayttaja/ntm-vastuukayttaja? (constantly false)]
        (is (not (sisaltaa-kyselypohjan (hae-kyselypohjat ytunnus)
                                        (:kyselypohjaid kyselypohja))))))))

;; tarkastetaan ettei haku duplikoi organisaatiolla olevia valtakunnallisia pohjia
(deftest ^:integraatio hae-kyselypohjat-valtakunnalliset-oph
  (let [oph (lisaa-koulutustoimija!  {:ytunnus "1111111-1"})]
    (sql/insert kyselypohja (sql/values [{:nimi_fi "a"
                                          :tila "julkaistu"
                                          :valtakunnallinen true
                                          :koulutustoimija (:ytunnus oph)}]))
    (is (= ["a"] (map :nimi_fi (hae-kyselypohjat (:ytunnus oph)))))))

(deftest ^:integraatio kyselypohjan-voimassaolo-paattynyt
  (let [koulutustoimija (lisaa-koulutustoimija!)]
    (sql/insert kyselypohja (sql/values [{:nimi_fi "a"
                                          :tila "julkaistu"
                                          :voimassa_alkupvm (time/local-date 1900 1 1)
                                          :voimassa_loppupvm (time/minus (time/today) (time/days 1))
                                          :koulutustoimija (:ytunnus koulutustoimija)}]))
    (is (= [false] (map :voimassa (hae-kyselypohjat (:ytunnus koulutustoimija)))))))

(deftest ^:integraatio kyselypohja-ei-ole-viela-voimassa
  (let [koulutustoimija (lisaa-koulutustoimija!)]
    (sql/insert kyselypohja (sql/values [{:nimi_fi "a"
                                          :tila "julkaistu"
                                          :voimassa_alkupvm (time/plus (time/today) (time/days 1))
                                          :voimassa_loppupvm (time/local-date 2100 1 1)
                                          :koulutustoimija (:ytunnus koulutustoimija)}]))
    (is (= [false] (map :voimassa (hae-kyselypohjat (:ytunnus koulutustoimija)))))))

(deftest ^:integraatio kyselypohja-on-voimassa
  (let [koulutustoimija (lisaa-koulutustoimija!)]
    (sql/insert kyselypohja (sql/values [{:nimi_fi "a"
                                          :tila "julkaistu"
                                          :voimassa_alkupvm (time/minus (time/today) (time/days 1))
                                          :voimassa_loppupvm (time/plus (time/today) (time/days 1))
                                          :koulutustoimija (:ytunnus koulutustoimija)}]))
    (is (= [true] (map :voimassa (hae-kyselypohjat (:ytunnus koulutustoimija)))))))

(deftest ^:integraatio kyselypohja-on-suljettu
  (let [koulutustoimija (lisaa-koulutustoimija!)]
    (sql/insert kyselypohja (sql/values [{:nimi_fi "a"
                                          :tila "suljettu"
                                          :voimassa_alkupvm (time/minus (time/today) (time/days 1))
                                          :voimassa_loppupvm (time/plus (time/today) (time/days 1))
                                          :koulutustoimija (:ytunnus koulutustoimija)}]))
    (is (= [false] (map :voimassa (hae-kyselypohjat (:ytunnus koulutustoimija)))))))
