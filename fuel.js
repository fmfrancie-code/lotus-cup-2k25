export function gestisciConsumoBenzinaAiBox(indiceCasellaBenzinaSelezionata) {
    let arrayCaselleBenzinaCorrente = [...gameState.markedUsages.fuel];
    const totaleCaselleDisponibiliBenzina = gameState.baseValues.fuel + gameState.allocations.fuel;
    
    // 1. Memorizziamo le caselle pulite PRIMA di effettuare il click dell'utente
    const caselleSenzaXPrima = totaleCaselleDisponibiliBenzina - arrayCaselleBenzinaCorrente.length;

    const laCasellaContieneGiaUnaX = arrayCaselleBenzinaCorrente.includes(indiceCasellaBenzinaSelezionata);
    let stringaMovimentoBox = "+0 MOV";

    if (laCasellaContieneGiaUnaX) {
        const indiceDaRimuovere = arrayCaselleBenzinaCorrente.indexOf(indiceCasellaBenzinaSelezionata);
        if (indiceDaRimuovere !== -1) {
            arrayCaselleBenzinaCorrente.splice(indiceDaRimuovere, 1);
        }
    } else {
        let indiceDestraDisponibile = -1;
        for (let i = totaleCaselleDisponibiliBenzina - 1; i >= 0; i--) {
            if (!arrayCaselleBenzinaCorrente.includes(i)) {
                indiceDestraDisponibile = i;
                break;
            }
        }
        if (indiceDestraDisponibile !== -1) {
            arrayCaselleBenzinaCorrente.push(indiceDestraDisponibile);
        }
    }

    let caselleSenzaXRimaste = totaleCaselleDisponibiliBenzina - arrayCaselleBenzinaCorrente.length;

    // 2. REGOLA DEL MONOLITE CORRETTA:
    // L'auto-fill al massimo scatta SOLO se eravamo a esattamente 3 caselle libere (leggerezza) 
    // e l'utente ha cliccato per portarle a 4. 
    // Se eravamo già al pieno o stavamo aggiungendo X, la regola non interviene e lasciamo piena libertà.
    if (totaleCaselleDisponibiliBenzina >= 5 && caselleSenzaXPrima === 3 && caselleSenzaXRimaste === 4) {
        arrayCaselleBenzinaCorrente = [];
        caselleSenzaXRimaste = totaleCaselleDisponibiliBenzina;
    }

    // 3. Calcolo del MOV coerente
    if (caselleSenzaXRimaste >= 4) {
        stringaMovimentoBox = "-2 MOV";
    } else if (caselleSenzaXRimaste <= 3 && caselleSenzaXRimaste > 0) {
        stringaMovimentoBox = "+1 MOV";
    }

    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            fuel: arrayCaselleBenzinaCorrente
        }
    });

    return {
        operazioneRiuscita: true,
        benzinaAggiornata: arrayCaselleBenzinaCorrente,
        caselleLibereRimaste: caselleSenzaXRimaste,
        stringaMov: stringaMovimentoBox,
        messaggioDescrittivo: "Rifornimento ai box aggiornato."
    };
}
