;; Copyright (c) 2015 The Finnish National Board of Education - Opetushallitus
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

(ns aipal.toimiala.raportti.yhdistaminen)

(defn yhdistä-kentästä [kenttä datat]
  {kenttä (map kenttä datat)})

(defn yhdistä-kaikki-kentät [datat]
  (reduce (fn [result key] (merge result (yhdistä-kentästä key datat)))
          {}
          (keys (first datat))))

(defn yhdistä-vektorit [vektorit]
  (when (not-every? nil? vektorit)
    (apply map vector
           (replace {nil (repeat nil)} vektorit))))

(defn yhdistä-samat [xs]
  {:pre [(let [xs (remove nil? xs)]
           (or (empty? xs) (apply = xs)))]}
  (first xs))

(defn päivitä-polusta [[k & ks] päivitä rakenne]
  (let [päivitä-seuraavat (if ks
                            (partial päivitä-polusta ks päivitä)
                            päivitä)]
    (if (sequential? rakenne)
      (map päivitä-seuraavat rakenne)
      (update-in rakenne [k] päivitä-seuraavat))))

(defn päivitä-kentät [kentät päivitä rakenne]
  (reduce (fn [rakenne kenttä] (update-in rakenne [kenttä] päivitä))
          rakenne
          kentät))

(defn käsittele-vapaatekstivastaukset [kysymys]
  (if (not-every? nil? (:vapaatekstivastaukset kysymys))
    (->> kysymys
      (päivitä-polusta [:vapaatekstivastaukset] yhdistä-vektorit)
      (päivitä-polusta [:vapaatekstivastaukset :*] yhdistä-kaikki-kentät))
    (assoc kysymys :vapaatekstivastaukset nil)))

(defn käsittele-kyllä-jatkovastaukset [jatkovastaukset]
  (if (not-every? nil? (:kylla jatkovastaukset))
    (->> jatkovastaukset
      (päivitä-polusta [:kylla] yhdistä-kaikki-kentät)
      (päivitä-polusta [:kylla :jakauma] yhdistä-vektorit)
      (päivitä-polusta [:kylla :jakauma :*] yhdistä-kaikki-kentät)
      (päivitä-polusta [:kylla] (partial päivitä-kentät [:kysymys_fi :kysymys_sv :vastaustyyppi] yhdistä-samat))
      (päivitä-polusta [:kylla :jakauma :*] (partial päivitä-kentät [:vaihtoehto-avain] yhdistä-samat)))
    (assoc jatkovastaukset :kylla nil)))

(defn käsittele-ei-jatkovastaukset [jatkovastaukset]
  (if (not-every? nil? (:ei jatkovastaukset))
    (->> jatkovastaukset
      (päivitä-polusta [:ei] yhdistä-kaikki-kentät)
      (päivitä-polusta [:ei] käsittele-vapaatekstivastaukset)
      (päivitä-polusta [:ei] (partial päivitä-kentät [:kysymys_fi :kysymys_sv :vastaustyyppi] yhdistä-samat)))
    (assoc jatkovastaukset :ei nil)))

(defn käsittele-kysymyksen-jatkovastaukset [kysymys]
  (if (not-every? nil? (:jatkovastaukset kysymys))
    (->> kysymys
      (päivitä-polusta [:jatkovastaukset] yhdistä-kaikki-kentät)
      (päivitä-polusta [:jatkovastaukset] käsittele-kyllä-jatkovastaukset)
      (päivitä-polusta [:jatkovastaukset] käsittele-ei-jatkovastaukset))
    (assoc kysymys :jatkovastaukset nil)))

(defn nimet-yhteen-listaan [data]
  (let [zipped (map vector (:nimi_fi data) (:nimi_sv data))
        nimet (for [z zipped] {:nimi_fi (first z)
                               :nimi_sv (second z)})]
    (->
      data
      (assoc :nimet nimet)
      (dissoc :nimi_fi :nimi_sv))))

(defn yhdista-raportit [raportit]
  (->> raportit
    yhdistä-kaikki-kentät
    (päivitä-polusta [:raportti] yhdistä-vektorit)
    (päivitä-polusta [:raportti :*] yhdistä-kaikki-kentät)
    (päivitä-polusta [:raportti :* :kysymykset] yhdistä-vektorit)
    (päivitä-polusta [:raportti :* :kysymykset :*] yhdistä-kaikki-kentät)
    (päivitä-polusta [:raportti :* :kysymykset :* :jakauma] yhdistä-vektorit)
    (päivitä-polusta [:raportti :* :kysymykset :* :jakauma :*] yhdistä-kaikki-kentät)
    (päivitä-polusta [:raportti :* :kysymykset :*] käsittele-vapaatekstivastaukset)
    (päivitä-polusta [:raportti :* :kysymykset :*] käsittele-kysymyksen-jatkovastaukset)
    (päivitä-polusta [:raportti :* :kysymykset :* :jakauma :*] (partial päivitä-kentät [:jarjestys :vaihtoehto_fi :vaihtoehto_sv :vaihtoehto-avain] yhdistä-samat))
    (päivitä-polusta [:raportti :* :kysymykset :*] (partial päivitä-kentät [:jarjestys :eos_vastaus_sallittu :kysymysid :kysymys_fi :kysymys_sv :vastaustyyppi] yhdistä-samat))
    (päivitä-polusta [:raportti :*] (partial päivitä-kentät [:kysymysryhmaid :nimi_fi :nimi_sv] yhdistä-samat))
    nimet-yhteen-listaan
    (päivitä-kentät [:luontipvm] first)))

