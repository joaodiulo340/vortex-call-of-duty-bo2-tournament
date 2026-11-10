import React, { useState, useEffect, useMemo } from 'react';
import vortexLogo from './assets/vortex-logo.webp';
import tournamentBackground from './assets/tournament-background.webp';
import { 
  Trophy, Shield, Users, Sword, Calendar, MapPin, DollarSign, 
  Lock, LogOut, CheckCircle2, XCircle, AlertCircle, RefreshCw, 
  Upload, Trash2, Edit, Plus, Search, ChevronRight, Check, X,
  Radio, Settings, FileText, Megaphone, Shuffle, Award, Flame,
  Eye, Menu, ChevronDown, CheckSquare, Image as ImageIcon
} from 'lucide-react';

// ==========================================
// CONFIGURAÇÃO INICIAL E ESTADOS EM MEMÓRIA
// ==========================================

const INITIAL_TOURNAMENT_CONFIG = {
  orgName: "VORTEX GAMING",
  slogan: "ONDE A COMPETIÇÃO GANHA VIDA",
  name: "VORTEX BO2 CHAMPIONSHIP",
  game: "Call of Duty: Black Ops II",
  mode: "2v2 — Duplas",
  format: "Double Elimination",
  date: "15 de Novembro de 2026",
  location: "Zango 2 / Centro Cultural / Frente ao PUNIV",
  entryFee: "2.000 Kz",
  prizePool: "20.000 Kz",
  status: "Inscrições Abertas", // Inscrições Abertas, Em Andamento, Concluído
  checkInOpen: false,
  logoUrl: null
};

const DEFAULT_MAPS = [
  { id: 'bo2-01', name: 'Aftermath', active: true },
  { id: 'bo2-02', name: 'Cargo', active: true },
  { id: 'bo2-03', name: 'Carrier', active: true },
  { id: 'bo2-04', name: 'Drone', active: true },
  { id: 'bo2-05', name: 'Express', active: true },
  { id: 'bo2-06', name: 'Hijacked', active: true },
  { id: 'bo2-07', name: 'Meltdown', active: true },
  { id: 'bo2-08', name: 'Nuketown 2025', active: true },
  { id: 'bo2-09', name: 'Plaza', active: true },
  { id: 'bo2-10', name: 'Raid', active: true },
  { id: 'bo2-11', name: 'Slums', active: true },
  { id: 'bo2-12', name: 'Standoff', active: true },
  { id: 'bo2-13', name: 'Turbine', active: true },
  { id: 'bo2-14', name: 'Yemen', active: true }
];

const DEFAULT_MODES = [
  { id: '1', name: 'Search & Destroy', active: true },
  { id: '2', name: 'Hardpoint', active: true },
  { id: '3', name: 'Capture the Flag', active: true }
];

const DEFAULT_RULES = `=== REGULAMENTO OFICIAL VORTEX 2v2 BLACK OPS II ===

1. FORMATO GERAL
- Modalidade: 2v2 (Duplas).
- Sistema: Double Elimination (Dupla Eliminação).
- Uma derrota na Winners Bracket move a dupla para a Losers Bracket.
- A segunda derrota resulta na eliminação definitiva do torneio.
- A Grand Final será disputada entre o vencedor da Winners e o vencedor da Losers. Se a dupla da Losers vencer a primeira série, ocorrerá o GRAND FINAL RESET (segunda série decisiva).

2. CONFIGURAÇÕES DAS PARTIDAS
- Host da sala: Decidido por sorteio de moeda ou acordo mútuo prévio.
- Todos os mapas e modos devem respeitar as escolhas sorteadas pela organização.

3. RESTRIÇÕES DE CLASSE & EQUIPAMENTO (PADRÃO MLG)
- Armas Proibidas: Launchers (SMAW, RPG), Shotguns secundárias, LMGs.
- Anexos Proibidos: Target Finder, Dual Wield, Select Fire, Grenade Launcher.
- Equipamentos Proibidos: C4, Claymore, Bouncing Betty, Sensor Grenade.
- Scorestreaks Proibidos: CUAV, VSAT, EMP, Dogs, Swarm.

4. CONDUTA E PENALIDADES
- Tolerância de atraso: 10 minutos. O não comparecimento resulta em W.O.
- Comportamento anti-desportivo incorrerá em desqualificação imediata sem reembolso.`;

export default function App() {
  // Configurações do Torneio
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('vortex_config');
    return saved ? JSON.parse(saved) : INITIAL_TOURNAMENT_CONFIG;
  });

  // Equipas / Duplas
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('vortex_teams');
    return saved ? JSON.parse(saved) : [];
  });

  // Mapas e Modos
  const [maps, setMaps] = useState(() => {
    const saved = localStorage.getItem('vortex_maps');
    if (!saved) return DEFAULT_MAPS;
    const savedMaps = JSON.parse(saved);
    return DEFAULT_MAPS.map(defaultMap => {
      const existing = savedMaps.find(item => item.name.toLowerCase() === defaultMap.name.toLowerCase());
      return existing ? { ...defaultMap, ...existing } : defaultMap;
    });
  });
  const [modes, setModes] = useState(() => {
    const saved = localStorage.getItem('vortex_modes');
    return saved ? JSON.parse(saved) : DEFAULT_MODES;
  });

  // Brackets e Partidas
  const [matches, setMatches] = useState(() => {
    const saved = localStorage.getItem('vortex_matches');
    return saved ? JSON.parse(saved) : [];
  });
  const [bracketDrawn, setBracketDrawn] = useState(() => {
    const saved = localStorage.getItem('vortex_drawn');
    return saved ? JSON.parse(saved) : false;
  });
  const [tournamentStarted, setTournamentStarted] = useState(() => localStorage.getItem('vortex_started') === 'true');

  // Regulamento e Comunicados
  const [rules, setRules] = useState(() => {
    return localStorage.getItem('vortex_rules') || DEFAULT_RULES;
  });
  const [announcements, setAnnouncements] = useState(() => {
    const saved = localStorage.getItem('vortex_announcements');
    return saved ? JSON.parse(saved) : [];
  });

  // Navegação e Autenticação
  const [currentView, setCurrentView] = useState('home'); // home, participants, bracket, rules, matches, admin, matchDetail
  const [adminTab, setAdminTab] = useState('dashboard');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('vortex_admin_session') === 'true';
  });
  const [adminAuthInput, setAdminAuthInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modais e Formulários
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerData, setRegisterData] = useState({ teamName: '', player1: '', player2: '', logo: null });
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Salvar no LocalStorage para persistência da sessão presencial
  useEffect(() => {
    localStorage.setItem('vortex_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('vortex_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('vortex_maps', JSON.stringify(maps));
  }, [maps]);

  useEffect(() => {
    localStorage.setItem('vortex_modes', JSON.stringify(modes));
  }, [modes]);

  useEffect(() => {
    localStorage.setItem('vortex_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('vortex_drawn', JSON.stringify(bracketDrawn));
  }, [bracketDrawn]);
  useEffect(() => {
    localStorage.setItem('vortex_started', tournamentStarted ? 'true' : 'false');
  }, [tournamentStarted]);

  useEffect(() => {
    localStorage.setItem('vortex_rules', rules);
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('vortex_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('vortex_admin_session', isAdminLoggedIn ? 'true' : 'false');
  }, [isAdminLoggedIn]);

  // Handle Login Admin
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminAuthInput === 'Clemente340') {
      setIsAdminLoggedIn(true);
      setAuthError('');
      setAdminAuthInput('');
      setCurrentView('admin');
    } else {
      setAuthError('Código de acesso incorrecto. Tente novamente.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentView('home');
  };

  // Inscrição de Dupla
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!registerData.teamName.trim() || !registerData.player1.trim() || !registerData.player2.trim()) return;

    // Verificar duplicações
    const exists = teams.some(t => t.name.toLowerCase() === registerData.teamName.trim().toLowerCase());
    if (exists) {
      alert("Já existe uma dupla cadastrada com este nome.");
      return;
    }

    const newTeam = {
      id: 'team_' + Date.now(),
      name: registerData.teamName.trim(),
      player1: registerData.player1.trim(),
      player2: registerData.player2.trim(),
      logo: registerData.logo,
      status: 'Pendente', // Pendente, Confirmada, Rejeitada, Desqualificada
      paymentStatus: 'Não pago', // Não pago, Pago, Pendente
      checkIn: false,
      createdAt: new Date().toLocaleDateString('pt-PT')
    };

    setTeams(prev => [...prev, newTeam]);
    setRegisterSuccess(true);
    setTimeout(() => {
      setRegisterSuccess(false);
      setShowRegisterModal(false);
      setRegisterData({ teamName: '', player1: '', player2: '', logo: null });
    }, 2000);
  };

  // Handler para Upload de Imagens (Galeria ou Desktop)
  const handleLogoUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Metricas Computadas para os Cards
  const stats = useMemo(() => {
    const totalTeams = teams.length;
    const confirmedTeams = teams.filter(t => t.status === 'Confirmada').length;
    const completedMatches = matches.filter(m => m.status === 'Finalizada').length;
    const pendingMatches = matches.filter(m => m.status === 'Agendada' || m.status === 'Em andamento').length;
    const winnersCount = matches.filter(m => m.bracket === 'Winners' && m.status !== 'Finalizada').length;
    const losersCount = matches.filter(m => m.bracket === 'Losers' && m.status !== 'Finalizada').length;
    
    // Contar eliminadas (2 derrotas)
    const lossesMap = {};
    matches.forEach(m => {
      if (m.status === 'Finalizada' && m.loserId) {
        lossesMap[m.loserId] = (lossesMap[m.loserId] || 0) + 1;
      }
    });
    const eliminatedCount = Object.values(lossesMap).filter(l => l >= 2).length;

    return {
      totalTeams,
      confirmedTeams,
      completedMatches,
      pendingMatches,
      winnersCount,
      losersCount,
      eliminatedCount
    };
  }, [teams, matches]);

  // ==========================================
  // ALGORITMO DOUBLE ELIMINATION REAL
  // ==========================================
  const handleGenerateBrackets = () => {
    const confirmed = teams.filter(t => t.status === 'Confirmada');
    if (confirmed.length < 2) {
      alert("É necessário ter pelo menos 2 duplas CONFIRMADAS para realizar o sorteio.");
      return;
    }

    if (!window.confirm(`Deseja realizar o Sorteio Oficial para ${confirmed.length} duplas? Esta acção recriará toda a tabela do torneio.`)) {
      return;
    }

    // Embaralhar aleatoriamente
    const shuffled = [...confirmed].sort(() => Math.random() - 0.5);

    // Calcular tamanho do bracket (próxima potência de 2)
    let size = 2;
    while (size < shuffled.length) {
      size *= 2;
    }

    const byesCount = size - shuffled.length;
    const firstRoundMatches = [];
    const generatedMatches = [];
    let matchIdCounter = 1;

    // Criar Primeira Rodada da Winners Bracket (W-R1)
    for (let i = 0; i < size / 2; i++) {
      const team1 = shuffled[i * 2] || null;
      const team2 = shuffled[i * 2 + 1] || null;

      let isBye = false;
      let winnerId = null;
      let loserId = null;
      let status = 'Agendada';

      // Tratamento de BYE
      if (team1 && !team2) {
        isBye = true;
        winnerId = team1.id;
        status = 'Finalizada';
      } else if (!team1 && team2) {
        isBye = true;
        winnerId = team2.id;
        status = 'Finalizada';
      }

      const match = {
        id: `M_${matchIdCounter++}`,
        bracket: 'Winners',
        round: 1,
        matchNumber: i + 1,
        team1Id: team1 ? team1.id : null,
        team2Id: team2 ? team2.id : null,
        score1: 0,
        score2: 0,
        winnerId: winnerId,
        loserId: loserId,
        status: status,
        map: null,
        mode: null,
        proofImage: null
      };

      generatedMatches.push(match);
    }

    // Estrutura de rodadas subsequentes da Winners
    let currentRoundMatchesCount = size / 2;
    let roundNum = 2;

    while (currentRoundMatchesCount > 1) {
      const nextCount = currentRoundMatchesCount / 2;
      for (let i = 0; i < nextCount; i++) {
        generatedMatches.push({
          id: `M_${matchIdCounter++}`,
          bracket: 'Winners',
          round: roundNum,
          matchNumber: i + 1,
          team1Id: null,
          team2Id: null,
          score1: 0,
          score2: 0,
          winnerId: null,
          loserId: null,
          status: 'Agendada',
          map: null,
          mode: null,
          proofImage: null
        });
      }
      currentRoundMatchesCount = nextCount;
      roundNum++;
    }

    // Criar Estrutura da Losers Bracket
    // Na Double Elimination standard, Losers tem aproximadamente 2x o número de rodadas da Winners
    const winnersRounds = Math.log2(size);
    const losersRounds = (winnersRounds - 1) * 2;

    for (let r = 1; r <= losersRounds; r++) {
      // Definir quantidade de jogos por rodada na Losers
      let matchesInRound;
      if (r === 1) {
        matchesInRound = size / 4;
      } else {
        const exp = Math.floor((r + 1) / 2);
        matchesInRound = Math.max(1, size / Math.pow(2, exp + 1));
      }

      for (let i = 0; i < matchesInRound; i++) {
        generatedMatches.push({
          id: `M_${matchIdCounter++}`,
          bracket: 'Losers',
          round: r,
          matchNumber: i + 1,
          team1Id: null,
          team2Id: null,
          score1: 0,
          score2: 0,
          winnerId: null,
          loserId: null,
          status: 'Agendada',
          map: null,
          mode: null,
          proofImage: null
        });
      }
    }

    // Grand Final
    generatedMatches.push({
      id: `M_GRAND_FINAL`,
      bracket: 'GrandFinal',
      round: 1,
      matchNumber: 1,
      team1Id: null, // Vencedor da Winners
      team2Id: null, // Vencedor da Losers
      score1: 0,
      score2: 0,
      winnerId: null,
      loserId: null,
      status: 'Agendada',
      isReset: false
    });

    // Grand Final Reset (Condicional)
    generatedMatches.push({
      id: `M_GRAND_FINAL_RESET`,
      bracket: 'GrandFinalReset',
      round: 2,
      matchNumber: 1,
      team1Id: null,
      team2Id: null,
      score1: 0,
      score2: 0,
      winnerId: null,
      loserId: null,
      status: 'Agendada',
      isReset: true,
      active: false // Activa apenas se a equipa da Losers vencer a Grand Final
    });

    // Avançar BYEs automaticamente
    let updatedMatches = [...generatedMatches];
    updatedMatches = autoAdvanceByes(updatedMatches);

    setMatches(updatedMatches);
    setBracketDrawn(true);
    alert("Sorteio Oficial realizado com sucesso! Brackets gerados.");
  };

  const handleStartTournament = () => {
    if (!isAdminLoggedIn) return alert('Apenas o administrador pode iniciar o torneio.');
    if (!bracketDrawn || matches.length === 0) {
      alert('Realiza primeiro o Sorteio Oficial para gerar os brackets.');
      setAdminTab('draw');
      return;
    }
    if (tournamentStarted) return alert('O torneio já foi iniciado.');
    if (!window.confirm('Confirmas o INÍCIO OFICIAL do torneio? Depois disso poderás lançar os resultados partida a partida.')) return;
    setTournamentStarted(true);
    setConfig(prev => ({ ...prev, status: 'Em Andamento' }));
    alert('Torneio iniciado oficialmente! Já podes lançar os resultados no painel Admin.');
  };

  // Função para avançar equipas por BYE ou Vitórias
  const autoAdvanceByes = (currentMatches) => {
    // Clona para mutação segura
    const list = JSON.parse(JSON.stringify(currentMatches));

    // Propagar vencedores da Winners R1 que tiveram BYE
    const wR1 = list.filter(m => m.bracket === 'Winners' && m.round === 1);
    const wR2 = list.filter(m => m.bracket === 'Winners' && m.round === 2);

    wR1.forEach((m, idx) => {
      if (m.status === 'Finalizada' && m.winnerId) {
        const nextMatchIdx = Math.floor(idx / 2);
        const targetMatch = wR2[nextMatchIdx];
        if (targetMatch) {
          if (idx % 2 === 0) {
            targetMatch.team1Id = m.winnerId;
          } else {
            targetMatch.team2Id = m.winnerId;
          }
        }
      }
    });

    return list;
  };

  // Atualizar Resultado de uma Partida
  const handleUpdateMatchResult = (matchId, score1, score2, map, mode, proofImage) => {
    if (!isAdminLoggedIn || !tournamentStarted) return alert('O lançamento de resultados só está disponível para o administrador depois do início oficial.');
    const s1 = parseInt(score1) || 0;
    const s2 = parseInt(score2) || 0;

    if (s1 === s2) {
      alert("As partidas no Call of Duty não podem terminar em empate!");
      return;
    }

    const winnerId = s1 > s2 ? selectedMatch.team1Id : selectedMatch.team2Id;
    const loserId = s1 > s2 ? selectedMatch.team2Id : selectedMatch.team1Id;

    let updated = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          score1: s1,
          score2: s2,
          winnerId,
          loserId,
          map,
          mode,
          proofImage,
          status: 'Finalizada'
        };
      }
      return m;
    });

    // Recalcular progressão dos brackets
    updated = recalculateBrackets(updated);
    setMatches(updated);
    setSelectedMatch(null);
    alert("Resultado gravado e brackets atualizados com sucesso!");
  };

  // Recalcular posições na Winners, Losers e Final
  const recalculateBrackets = (matchList) => {
    const list = JSON.parse(JSON.stringify(matchList));

    // Processar Winners Bracket
    const maxWinnersRound = Math.max(...list.filter(m => m.bracket === 'Winners').map(m => m.round), 0);

    for (let r = 1; r <= maxWinnersRound; r++) {
      const currentR = list.filter(m => m.bracket === 'Winners' && m.round === r);
      const nextR = list.filter(m => m.bracket === 'Winners' && m.round === r + 1);

      currentR.forEach((m, idx) => {
        if (m.status === 'Finalizada' && m.winnerId) {
          // Vencedor avança na Winners
          if (nextR.length > 0) {
            const nextMatch = nextR[Math.floor(idx / 2)];
            if (nextMatch) {
              if (idx % 2 === 0) nextMatch.team1Id = m.winnerId;
              else nextMatch.team2Id = m.winnerId;
            }
          } else {
            // Chegou à Grand Final pela Winners
            const gf = list.find(m => m.bracket === 'GrandFinal');
            if (gf) gf.team1Id = m.winnerId;
          }

          // Perdedor cai para a Losers Bracket
          if (m.loserId) {
            const lR1 = list.filter(m => m.bracket === 'Losers' && m.round === (r === 1 ? 1 : (r - 1) * 2));
            if (lR1.length > 0) {
              const targetMatch = lR1[Math.floor(idx / 2)] || lR1[0];
              if (targetMatch) {
                if (!targetMatch.team1Id) targetMatch.team1Id = m.loserId;
                else if (!targetMatch.team2Id && targetMatch.team1Id !== m.loserId) targetMatch.team2Id = m.loserId;
              }
            }
          }
        }
      });
    }

    // Processar Losers Bracket
    const maxLosersRound = Math.max(...list.filter(m => m.bracket === 'Losers').map(m => m.round), 0);
    for (let r = 1; r <= maxLosersRound; r++) {
      const currentR = list.filter(m => m.bracket === 'Losers' && m.round === r);
      const nextR = list.filter(m => m.bracket === 'Losers' && m.round === r + 1);

      currentR.forEach((m, idx) => {
        if (m.status === 'Finalizada' && m.winnerId) {
          if (nextR.length > 0) {
            const nextMatch = nextR[Math.floor(idx / 2)] || nextR[0];
            if (nextMatch) {
              if (!nextMatch.team1Id) nextMatch.team1Id = m.winnerId;
              else if (!nextMatch.team2Id && nextMatch.team1Id !== m.winnerId) nextMatch.team2Id = m.winnerId;
            }
          } else {
            // Vencedor da Losers avança para a Grand Final
            const gf = list.find(m => m.bracket === 'GrandFinal');
            if (gf) gf.team2Id = m.winnerId;
          }
        }
      });
    }

    // Processar Grand Final
    const gf = list.find(m => m.bracket === 'GrandFinal');
    const gfReset = list.find(m => m.bracket === 'GrandFinalReset');

    if (gf && gf.status === 'Finalizada') {
      // team1Id é quem veio da Winners (0 derrotas)
      // team2Id é quem veio da Losers (1 derrota)
      if (gf.winnerId === gf.team2Id) {
        // A dupla da Losers venceu a 1ª final! Ativa a GRAND FINAL RESET
        if (gfReset) {
          gfReset.active = true;
          gfReset.team1Id = gf.team1Id;
          gfReset.team2Id = gf.team2Id;
        }
      } else {
        // Vencedor da Winners ganhou -> É Campeão Imediato!
        if (gfReset) gfReset.active = false;
      }
    }

    return list;
  };

  // Sorteio Aleatório de Mapa e Modo
  const handleRandomizeMapAndMode = (matchId) => {
    const activeMaps = maps.filter(m => m.active);
    const activeModes = modes.filter(m => m.active);

    if (activeMaps.length === 0 || activeModes.length === 0) {
      alert("É necessário ter pelo menos 1 mapa e 1 modo ativos nas configurações.");
      return;
    }

    const randomMap = activeMaps[Math.floor(Math.random() * activeMaps.length)].name;
    const randomMode = activeModes[Math.floor(Math.random() * activeModes.length)].name;

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return { ...m, map: randomMap, mode: randomMode };
      }
      return m;
    }));
  };

  // Helper para buscar equipa por ID
  const getTeam = (id) => teams.find(t => t.id === id) || null;

  // Determinar Campeão
  const champion = useMemo(() => {
    const gfReset = matches.find(m => m.bracket === 'GrandFinalReset');
    if (gfReset && gfReset.active && gfReset.status === 'Finalizada' && gfReset.winnerId) {
      return getTeam(gfReset.winnerId);
    }
    const gf = matches.find(m => m.bracket === 'GrandFinal');
    if (gf && gf.status === 'Finalizada' && gf.winnerId && (!gfReset || !gfReset.active)) {
      return getTeam(gf.winnerId);
    }
    return null;
  }, [matches, teams]);

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-amber-500 selection:text-black">
      
      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* LOGO & BRAND */}
            <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setCurrentView('home')}>
              <img src={config.logoUrl || vortexLogo} alt="VORTEX Logo" className="h-14 w-14 object-contain rounded-full" />
              <div>
                <h1 className="text-xl font-black text-white tracking-wider flex items-center gap-2">
                  VORTEX <span className="text-amber-400 font-light text-sm tracking-normal">MANAGER</span>
                </h1>
                <p className="text-xs text-zinc-400 font-medium tracking-widest uppercase">{config.slogan}</p>
              </div>
            </div>

            {/* NAV DESKTOP */}
            <nav className="hidden md:flex items-center space-x-1">
              <button 
                onClick={() => setCurrentView('home')} 
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${currentView === 'home' ? 'text-amber-400 bg-zinc-900 border border-amber-500/30' : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-900/50'}`}
              >
                Início
              </button>
              <button 
                onClick={() => setCurrentView('participants')} 
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${currentView === 'participants' ? 'text-amber-400 bg-zinc-900 border border-amber-500/30' : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-900/50'}`}
              >
                Participantes
              </button>
              <button 
                onClick={() => setCurrentView('bracket')} 
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${currentView === 'bracket' ? 'text-amber-400 bg-zinc-900 border border-amber-500/30' : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-900/50'}`}
              >
                Brackets
              </button>
              <button 
                onClick={() => setCurrentView('matches')} 
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${currentView === 'matches' ? 'text-amber-400 bg-zinc-900 border border-amber-500/30' : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-900/50'}`}
              >
                Partidas
              </button>
              <button 
                onClick={() => setCurrentView('rules')} 
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${currentView === 'rules' ? 'text-amber-400 bg-zinc-900 border border-amber-500/30' : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-900/50'}`}
              >
                Regulamento
              </button>
            </nav>

            {/* BOTÃO PAINEL ADMIN / AUTH */}
            <div className="hidden md:flex items-center space-x-3">
              {isAdminLoggedIn ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentView('admin')} 
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-md shadow-md shadow-amber-500/20 transition flex items-center gap-2"
                  >
                    <Shield size={16} /> Painel Admin
                  </button>
                  <button 
                    onClick={handleAdminLogout}
                    className="p-2 bg-zinc-900 hover:bg-red-950 hover:text-red-400 text-zinc-400 rounded-md border border-zinc-800 transition"
                    title="Terminar Sessão"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setCurrentView('admin_auth')}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 font-semibold text-sm rounded-md transition flex items-center gap-2"
                >
                  <Lock size={14} /> Admin Access
                </button>
              )}
            </div>

            {/* HAMBURGER MOBILE */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-zinc-300 hover:text-amber-400 focus:outline-none"
              >
                <Menu size={24} />
              </button>
            </div>

          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-950 border-b border-zinc-800 px-4 py-3 space-y-2">
            <button onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-zinc-200 hover:text-amber-400">Início</button>
            <button onClick={() => { setCurrentView('participants'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-zinc-200 hover:text-amber-400">Participantes</button>
            <button onClick={() => { setCurrentView('bracket'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-zinc-200 hover:text-amber-400">Brackets</button>
            <button onClick={() => { setCurrentView('matches'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-zinc-200 hover:text-amber-400">Partidas</button>
            <button onClick={() => { setCurrentView('rules'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-zinc-200 hover:text-amber-400">Regulamento</button>
            <div className="pt-2 border-t border-zinc-900">
              {isAdminLoggedIn ? (
                <button onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false); }} className="w-full py-2 bg-amber-500 text-black font-bold rounded text-center">Painel Admin</button>
              ) : (
                <button onClick={() => { setCurrentView('admin_auth'); setMobileMenuOpen(false); }} className="w-full py-2 bg-zinc-900 text-amber-400 border border-amber-500/30 rounded text-center">Painel Administrativo</button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* CONTEÚDO PRINCIPAL - ROUTER INTERNO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ------------------------------------------------------------- */}
        {/* VIEW: HOME / LANDING PAGE */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'home' && (
          <div className="space-y-12">
            
            {/* HERO BANNER */}
            <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-zinc-950 bg-cover bg-center p-8 md:p-12 shadow-2xl" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.70) 48%, rgba(0,0,0,.28) 100%), url(${tournamentBackground})` }}>
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 space-y-6 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
                  <Flame size={14} className="animate-pulse text-amber-400" /> Torneio Presencial Oficial
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase leading-none">
                  {config.name}
                </h1>
                
                <p className="text-lg text-zinc-300 font-medium">
                  {config.game} • Modalidade <span className="text-amber-400 font-bold">{config.mode}</span> • Formato <span className="text-amber-400 font-bold">{config.format}</span>
                </p>

                {/* DETALHES RÁPIDOS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-zinc-800/80">
                  <div>
                    <span className="text-xs text-zinc-400 block uppercase font-semibold">Data</span>
                    <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5"><Calendar size={14} className="text-amber-400"/> {config.date}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block uppercase font-semibold">Local</span>
                    <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5"><MapPin size={14} className="text-amber-400"/> {config.location}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block uppercase font-semibold">Inscrição</span>
                    <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5 mt-0.5"><DollarSign size={14}/> {config.entryFee}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block uppercase font-semibold">Premiação</span>
                    <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5 mt-0.5"><Trophy size={14}/> {config.prizePool}</span>
                  </div>
                </div>

                {/* BOTÕES DE ACÇÃO RÁPIDA */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button 
                    onClick={() => setShowRegisterModal(true)} 
                    className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase text-sm tracking-wider rounded-lg shadow-lg shadow-amber-500/25 transition transform hover:-translate-y-0.5"
                  >
                    Inscrever Dupla (2v2)
                  </button>
                  <button 
                    onClick={() => setCurrentView('participants')} 
                    className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-sm rounded-lg border border-zinc-800 transition"
                  >
                    [ PARTICIPANTES ]
                  </button>
                  <button 
                    onClick={() => setCurrentView('bracket')} 
                    className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-sm rounded-lg border border-zinc-800 transition"
                  >
                    [ BRACKET ]
                  </button>
                  <button 
                    onClick={() => setCurrentView('rules')} 
                    className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-sm rounded-lg border border-zinc-800 transition"
                  >
                    [ REGULAMENTO ]
                  </button>
                </div>
              </div>
            </div>

            {/* HALLE OF FAME - CAMPEÃO (SE HOUVER) */}
            {champion && (
              <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 border border-amber-500/50 rounded-xl p-6 text-center space-y-3 relative overflow-hidden">
                <div className="inline-flex items-center justify-center p-3 bg-amber-500/20 rounded-full text-amber-400 mb-2">
                  <Trophy size={40} className="text-amber-400 animate-bounce" />
                </div>
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">GRANDE CAMPEÃO DO TORNEIO</h3>
                <h2 className="text-3xl font-black text-white">{champion.name}</h2>
                <p className="text-sm text-zinc-300 font-medium">
                  Jogadores: <span className="text-amber-300">{champion.player1}</span> & <span className="text-amber-300">{champion.player2}</span>
                </p>
              </div>
            )}

            {/* INDICADORES AUTOMÁTICOS */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award className="text-amber-400" size={20} /> Indicadores em Tempo Real
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
                  <span className="text-2xl font-black text-white">{stats.totalTeams}</span>
                  <span className="block text-xs text-zinc-400 font-medium mt-1">Total Duplas</span>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
                  <span className="text-2xl font-black text-emerald-400">{stats.confirmedTeams}</span>
                  <span className="block text-xs text-zinc-400 font-medium mt-1">Confirmadas</span>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
                  <span className="text-2xl font-black text-amber-400">{stats.completedMatches}</span>
                  <span className="block text-xs text-zinc-400 font-medium mt-1">Realizadas</span>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
                  <span className="text-2xl font-black text-zinc-300">{stats.pendingMatches}</span>
                  <span className="block text-xs text-zinc-400 font-medium mt-1">Pendentes</span>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
                  <span className="text-2xl font-black text-blue-400">{stats.winnersCount}</span>
                  <span className="block text-xs text-zinc-400 font-medium mt-1">Winners Bracket</span>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
                  <span className="text-2xl font-black text-orange-400">{stats.losersCount}</span>
                  <span className="block text-xs text-zinc-400 font-medium mt-1">Losers Bracket</span>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
                  <span className="text-2xl font-black text-red-500">{stats.eliminatedCount}</span>
                  <span className="block text-xs text-zinc-400 font-medium mt-1">Eliminadas</span>
                </div>
              </div>
            </div>

            {/* COMUNICADOS RECENTES */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Megaphone size={18} className="text-amber-400" /> Comunicados Oficiais
              </h2>
              {announcements.length === 0 ? (
                <p className="text-zinc-500 text-sm italic py-4">Nenhum comunicado publicado até ao momento.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-amber-400 uppercase">{ann.title}</span>
                        <span className="text-xs text-zinc-500">{ann.date}</span>
                      </div>
                      <p className="text-sm text-zinc-300">{ann.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: PARTICIPANTES */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'participants' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">Equipas & Duplas Inscritas</h2>
                <p className="text-sm text-zinc-400">Lista completa de participantes inscritos no torneio.</p>
              </div>
              <button 
                onClick={() => setShowRegisterModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-lg transition"
              >
                + Nova Inscrição
              </button>
            </div>

            {teams.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-12 text-center space-y-3">
                <Users size={48} className="mx-auto text-zinc-600" />
                <h3 className="text-lg font-bold text-zinc-300">Ainda não existem equipas inscritas.</h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Utilize o botão de inscrição para registar a primeira dupla ou aguarde pelas inscrições dos participantes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((t) => (
                  <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 relative overflow-hidden hover:border-amber-500/40 transition">
                    <div className="flex items-center space-x-4">
                      {t.logo ? (
                        <img src={t.logo} alt={t.name} className="w-14 h-14 object-cover rounded-lg border border-amber-500/30" />
                      ) : (
                        <div className="w-14 h-14 bg-zinc-800 rounded-lg flex items-center justify-center font-bold text-amber-400 border border-zinc-700">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white text-lg">{t.name}</h3>
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                          t.status === 'Confirmada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          t.status === 'Pendente' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/60 space-y-1">
                      <span className="text-xs text-zinc-500 font-semibold block uppercase">Atletas da Dupla</span>
                      <div className="flex justify-between text-sm font-medium text-zinc-200">
                        <span>🎮 {t.player1}</span>
                        <span>🎮 {t.player2}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: VISUALIZAÇÃO DOS BRACKETS (DOUBLE ELIMINATION) */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'bracket' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sword size={24} className="text-amber-400" /> Tabela do Torneio (Double Elimination)
              </h2>
              <p className="text-sm text-zinc-400">Acompanhe os confrontos na Winners Bracket e Losers Bracket.</p>
            </div>

            {!bracketDrawn || matches.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center space-y-3">
                <RefreshCw size={48} className="mx-auto text-zinc-600" />
                <h3 className="text-lg font-bold text-zinc-300">O sorteio ainda não foi realizado.</h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Aguarde pela realização do sorteio oficial no painel administrativo para visualizar o chaveamento completo.
                </p>
              </div>
            ) : (
              <div className="space-y-10 overflow-x-auto pb-6">
                
                {/* WINNERS BRACKET */}
                <div className="space-y-4">
                  <div className="border-l-4 border-amber-400 pl-3">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">WINNERS BRACKET</h3>
                    <p className="text-xs text-zinc-400">Equipas invictas no torneio.</p>
                  </div>
                  
                  <div className="flex gap-6 min-w-max">
                    {[1, 2, 3, 4].map((roundNum) => {
                      const roundMatches = matches.filter(m => m.bracket === 'Winners' && m.round === roundNum);
                      if (roundMatches.length === 0) return null;

                      return (
                        <div key={roundNum} className="w-64 space-y-4">
                          <div className="text-center bg-zinc-900 py-1 rounded text-xs font-bold text-amber-400 border border-zinc-800">
                            Rodada {roundNum}
                          </div>
                          {roundMatches.map(m => {
                            const t1 = getTeam(m.team1Id);
                            const t2 = getTeam(m.team2Id);
                            return (
                              <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2 shadow-md hover:border-amber-500/40 transition">
                                <div className="text-[10px] text-zinc-500 uppercase flex justify-between font-semibold">
                                  <span>Jogo #{m.matchNumber}</span>
                                  <span>{m.status}</span>
                                </div>
                                <div className={`p-2 rounded flex items-center justify-between font-bold text-sm ${m.winnerId === m.team1Id && m.status === 'Finalizada' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-zinc-950 text-zinc-300'}`}>
                                  <span className="truncate">{t1 ? t1.name : 'BYE / A Definir'}</span>
                                  <span>{m.score1}</span>
                                </div>
                                <div className={`p-2 rounded flex items-center justify-between font-bold text-sm ${m.winnerId === m.team2Id && m.status === 'Finalizada' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-zinc-950 text-zinc-300'}`}>
                                  <span className="truncate">{t2 ? t2.name : 'BYE / A Definir'}</span>
                                  <span>{m.score2}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LOSERS BRACKET */}
                <div className="space-y-4">
                  <div className="border-l-4 border-orange-500 pl-3">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">LOSERS BRACKET</h3>
                    <p className="text-xs text-zinc-400">Equipas com 1 derrota. Próxima derrota resulta em eliminação.</p>
                  </div>

                  <div className="flex gap-6 min-w-max">
                    {[1, 2, 3, 4, 5, 6].map((roundNum) => {
                      const roundMatches = matches.filter(m => m.bracket === 'Losers' && m.round === roundNum);
                      if (roundMatches.length === 0) return null;

                      return (
                        <div key={roundNum} className="w-64 space-y-4">
                          <div className="text-center bg-zinc-900 py-1 rounded text-xs font-bold text-orange-400 border border-zinc-800">
                            Losers R{roundNum}
                          </div>
                          {roundMatches.map(m => {
                            const t1 = getTeam(m.team1Id);
                            const t2 = getTeam(m.team2Id);
                            return (
                              <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2 shadow-md">
                                <div className="text-[10px] text-zinc-500 uppercase flex justify-between font-semibold">
                                  <span>Jogo #{m.matchNumber}</span>
                                  <span>{m.status}</span>
                                </div>
                                <div className={`p-2 rounded flex items-center justify-between font-bold text-sm ${m.winnerId === m.team1Id && m.status === 'Finalizada' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-zinc-950 text-zinc-300'}`}>
                                  <span className="truncate">{t1 ? t1.name : 'A Definir'}</span>
                                  <span>{m.score1}</span>
                                </div>
                                <div className={`p-2 rounded flex items-center justify-between font-bold text-sm ${m.winnerId === m.team2Id && m.status === 'Finalizada' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-zinc-950 text-zinc-300'}`}>
                                  <span className="truncate">{t2 ? t2.name : 'A Definir'}</span>
                                  <span>{m.score2}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* GRAND FINAL */}
                <div className="space-y-4">
                  <div className="border-l-4 border-yellow-400 pl-3">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">GRAND FINAL</h3>
                    <p className="text-xs text-zinc-400">Confronto final pelo título de campeão.</p>
                  </div>

                  <div className="flex gap-6">
                    {matches.filter(m => m.bracket === 'GrandFinal').map(m => {
                      const t1 = getTeam(m.team1Id);
                      const t2 = getTeam(m.team2Id);
                      return (
                        <div key={m.id} className="w-80 bg-zinc-900 border-2 border-amber-500/50 rounded-xl p-4 space-y-3 shadow-xl">
                          <div className="text-xs font-bold text-amber-400 uppercase text-center">
                            PRIMEIRA SÉRIE DECISIVA
                          </div>
                          <div className={`p-3 rounded-lg flex items-center justify-between font-bold text-base ${m.winnerId === m.team1Id && m.status === 'Finalizada' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-950 text-zinc-200'}`}>
                            <span>{t1 ? t1.name : 'Vencedor Winners'}</span>
                            <span className="text-lg">{m.score1}</span>
                          </div>
                          <div className={`p-3 rounded-lg flex items-center justify-between font-bold text-base ${m.winnerId === m.team2Id && m.status === 'Finalizada' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-950 text-zinc-200'}`}>
                            <span>{t2 ? t2.name : 'Vencedor Losers'}</span>
                            <span className="text-lg">{m.score2}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* RESET GRAND FINAL */}
                    {matches.find(m => m.bracket === 'GrandFinalReset')?.active && (
                      {...matches.filter(m => m.bracket === 'GrandFinalReset').map(m => {
                        const t1 = getTeam(m.team1Id);
                        const t2 = getTeam(m.team2Id);
                        return (
                          <div key={m.id} className="w-80 bg-zinc-900 border-2 border-red-500 rounded-xl p-4 space-y-3 shadow-xl animate-pulse">
                            <div className="text-xs font-bold text-red-400 uppercase text-center">
                              🔥 GRAND FINAL RESET (DECISÃO FINAL)
                            </div>
                            <div className={`p-3 rounded-lg flex items-center justify-between font-bold text-base ${m.winnerId === m.team1Id && m.status === 'Finalizada' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-950 text-zinc-200'}`}>
                              <span>{t1 ? t1.name : 'A Definir'}</span>
                              <span className="text-lg">{m.score1}</span>
                            </div>
                            <div className={`p-3 rounded-lg flex items-center justify-between font-bold text-base ${m.winnerId === m.team2Id && m.status === 'Finalizada' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-950 text-zinc-200'}`}>
                              <span>{t2 ? t2.name : 'A Definir'}</span>
                              <span className="text-lg">{m.score2}</span>
                            </div>
                          </div>
                        );
                      })}
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: LISTA DE PARTIDAS */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'matches' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">Partidas do Torneio</h2>
              <p className="text-sm text-zinc-400">Consulta de resultados e agendamentos.</p>
            </div>

            {matches.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
                <p className="text-zinc-400">Nenhuma partida foi disputada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map(m => {
                  const t1 = getTeam(m.team1Id);
                  const t2 = getTeam(m.team2Id);
                  return (
                    <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center space-x-3 text-xs text-zinc-400">
                        <span className="bg-zinc-800 px-2 py-1 rounded font-bold uppercase">{m.bracket}</span>
                        <span>Rodada {m.round}</span>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right w-36">
                          <span className="font-bold text-white block truncate">{t1 ? t1.name : 'TBD'}</span>
                        </div>
                        <div className="bg-zinc-950 px-4 py-2 rounded-lg font-black text-amber-400 text-lg border border-zinc-800">
                          {m.score1} - {m.score2}
                        </div>
                        <div className="text-left w-36">
                          <span className="font-bold text-white block truncate">{t2 ? t2.name : 'TBD'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {m.map && <span className="text-xs bg-zinc-800 px-2.5 py-1 rounded text-zinc-300">{m.map} ({m.mode})</span>}
                        {isAdminLoggedIn && (
                          <button 
                            onClick={() => { setSelectedMatch(m); setCurrentView('admin'); setAdminTab('matches'); }}
                            className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded hover:bg-amber-500 hover:text-black transition"
                          >
                            Gerir Result.
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: REGULAMENTO */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'rules' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">Regulamento Oficial</h2>
              <p className="text-sm text-zinc-400">Regras e directrizes de competição baseadas na MLG BO2.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 whitespace-pre-wrap text-zinc-300 font-mono text-sm leading-relaxed shadow-lg">
              {rules}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: AUTENTICAÇÃO ADMINISTRATIVA */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'admin_auth' && (
          <div className="max-w-md mx-auto py-12">
            <div className="bg-zinc-950 border border-amber-500/30 rounded-2xl p-8 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-black text-white">PAINEL ADMINISTRATIVO</h2>
                <p className="text-xs text-zinc-400">Insira o código de acesso para gerir o torneio.</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Código de Acesso</label>
                  <input 
                    type="password" 
                    value={adminAuthInput}
                    onChange={(e) => setAdminAuthInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {authError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-semibold text-red-400 text-center">
                    {authError}
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-sm rounded-lg shadow-lg shadow-amber-500/20 transition"
                >
                  Entrar no Painel
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: PAINEL ADMINISTRATIVO (PROTEGIDO) */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'admin' && isAdminLoggedIn && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* MENU LATERAL DO ADMIN */}
            <div className="md:col-span-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Navegação Admin</div>
              
              <button 
                onClick={() => setAdminTab('dashboard')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition ${adminTab === 'dashboard' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-zinc-900'}`}
              >
                <Settings size={16} /> Dashboard
              </button>
              <button 
                onClick={() => setAdminTab('teams')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition ${adminTab === 'teams' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-zinc-900'}`}
              >
                <Users size={16} /> Gestão de Equipas ({teams.length})
              </button>
              <button 
                onClick={() => setAdminTab('draw')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition ${adminTab === 'draw' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-zinc-900'}`}
              >
                <Shuffle size={16} /> Sorteio Oficial
              </button>
              <button 
                onClick={() => setAdminTab('maps')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition ${adminTab === 'maps' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-zinc-900'}`}
              >
                <Radio size={16} /> Mapas e Modos
              </button>
              <button 
                onClick={() => setAdminTab('matches')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition ${adminTab === 'matches' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-zinc-900'}`}
              >
                <Sword size={16} /> Lançar Resultados
              </button>
              <button 
                onClick={() => setAdminTab('rules_edit')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition ${adminTab === 'rules_edit' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-zinc-900'}`}
              >
                <FileText size={16} /> Editar Regulamento
              </button>
              <button 
                onClick={() => setAdminTab('announcements_edit')} 
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition ${adminTab === 'announcements_edit' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-zinc-900'}`}
              >
                <Megaphone size={16} /> Comunicados
              </button>
            </div>

            {/* CONTEÚDO DO TAB ADMIN */}
            <div className="md:col-span-3 space-y-6">
              
              {/* ADMIN TAB: DASHBOARD / CONFIGURACAO TORNEIO */}
              {adminTab === 'dashboard' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                  <h3 className="text-xl font-bold text-white border-b border-zinc-800 pb-3">Configurações Gerais do Torneio</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-amber-500/30 bg-zinc-950 p-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Estado do torneio</p>
                      <p className={`mt-1 text-lg font-black ${tournamentStarted ? 'text-green-400' : 'text-amber-400'}`}>
                        {tournamentStarted ? 'EM ANDAMENTO' : bracketDrawn ? 'PRONTO PARA INICIAR' : 'AGUARDANDO SORTEIO'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">Faz o sorteio primeiro. Depois inicia o torneio para poderes registar os resultados.</p>
                    </div>
                    <button onClick={handleStartTournament} disabled={tournamentStarted}
                      className="px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-black uppercase text-sm transition">
                      {tournamentStarted ? 'Torneio iniciado' : '▶ Iniciar torneio'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Nome da Organização</label>
                      <input 
                        type="text" 
                        value={config.orgName} 
                        onChange={(e) => setConfig({ ...config, orgName: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Nome do Torneio</label>
                      <input 
                        type="text" 
                        value={config.name} 
                        onChange={(e) => setConfig({ ...config, name: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Data</label>
                      <input 
                        type="text" 
                        value={config.date} 
                        onChange={(e) => setConfig({ ...config, date: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Localização</label>
                      <input 
                        type="text" 
                        value={config.location} 
                        onChange={(e) => setConfig({ ...config, location: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Valor Inscrição (Kz)</label>
                      <input 
                        type="text" 
                        value={config.entryFee} 
                        onChange={(e) => setConfig({ ...config, entryFee: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Premiação (Kz)</label>
                      <input 
                        type="text" 
                        value={config.prizePool} 
                        onChange={(e) => setConfig({ ...config, prizePool: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  {/* CARREGAR LOGÓTIPO OFICIAL DA VORTEX */}
                  <div className="pt-4 border-t border-zinc-800 space-y-3">
                    <label className="block text-xs font-bold text-zinc-400 uppercase">Logótipo Oficial da VORTEX Gaming</label>
                    <div className="flex items-center space-x-4">
                      {config.logoUrl && (
                        <img src={config.logoUrl} alt="Logo Vortex" className="h-16 w-16 object-contain border border-zinc-700 rounded p-1 bg-black" />
                      )}
                      <label className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded cursor-pointer flex items-center gap-2">
                        <Upload size={14} /> Carregar Logótipo Oficial
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, (url) => setConfig({ ...config, logoUrl: url }))} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: GESTAO DE EQUIPAS */}
              {adminTab === 'teams' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <h3 className="text-xl font-bold text-white">Gestão e Aprovação de Duplas</h3>
                    <button onClick={() => setShowRegisterModal(true)} className="px-3 py-1.5 bg-amber-500 text-black font-bold text-xs rounded">
                      + Adicionar Manualmente
                    </button>
                  </div>

                  {teams.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Ainda não existem equipas inscritas.</p>
                  ) : (
                    <div className="space-y-4">
                      {teams.map(t => (
                        <div key={t.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-center space-x-3">
                            {t.logo ? (
                              <img src={t.logo} alt={t.name} className="w-10 h-10 object-cover rounded" />
                            ) : (
                              <div className="w-10 h-10 bg-zinc-800 text-amber-400 font-bold flex items-center justify-center rounded">
                                {t.name.slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-white">{t.name}</h4>
                              <span className="text-xs text-zinc-400">Atletas: {t.player1} & {t.player2}</span>
                            </div>
                          </div>

                          {/* CONTROLES DE APROVAÇÃO */}
                          <div className="flex flex-wrap items-center gap-2">
                            <select 
                              value={t.status} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setTeams(prev => prev.map(item => item.id === t.id ? { ...item, status: val } : item));
                              }}
                              className="bg-zinc-900 text-xs border border-zinc-700 text-white p-1.5 rounded"
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Confirmada">Confirmada</option>
                              <option value="Rejeitada">Rejeitada</option>
                              <option value="Desqualificada">Desqualificada</option>
                            </select>

                            <select 
                              value={t.paymentStatus} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setTeams(prev => prev.map(item => item.id === t.id ? { ...item, paymentStatus: val } : item));
                              }}
                              className="bg-zinc-900 text-xs border border-zinc-700 text-amber-400 p-1.5 rounded"
                            >
                              <option value="Não pago">Não Pago</option>
                              <option value="Pago">Pago (Kz)</option>
                            </select>

                            <button 
                              onClick={() => {
                                if (window.confirm(`Eliminar permanentemente a dupla ${t.name}?`)) {
                                  setTeams(prev => prev.filter(item => item.id !== t.id));
                                }
                              }}
                              className="p-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN TAB: SORTEIO */}
              {adminTab === 'draw' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                  <h3 className="text-xl font-bold text-white border-b border-zinc-800 pb-3">Sorteio Oficial dos Brackets</h3>
                  <p className="text-sm text-zinc-400">
                    Ao realizar o sorteio oficial, o sistema distribuirá aleatoriamente todas as duplas CONFIRMADAS no formato de Double Elimination.
                  </p>

                  <div className="p-4 bg-zinc-950 border border-amber-500/20 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 block font-semibold">Duplas Elegíveis (Confirmadas)</span>
                      <span className="text-2xl font-black text-amber-400">
                        {teams.filter(t => t.status === 'Confirmada').length}
                      </span>
                    </div>

                    <button 
                      onClick={handleGenerateBrackets}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase text-sm rounded-lg shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
                    >
                      <Shuffle size={18} /> REALIZAR SORTEIO OFICIAL
                    </button>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: MAPAS E MODOS */}
              {adminTab === 'maps' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                  <h3 className="text-xl font-bold text-white border-b border-zinc-800 pb-3">Configuração de Mapas & Modos BO2</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* MAPAS */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-amber-400 text-sm uppercase">Mapas Permitidos</h4>
                      <div className="space-y-2">
                        {maps.map(m => (
                          <div key={m.id} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded border border-zinc-800">
                            <span className="text-sm text-white font-medium">{m.name}</span>
                            <input 
                              type="checkbox" 
                              checked={m.active} 
                              onChange={(e) => setMaps(prev => prev.map(item => item.id === m.id ? { ...item, active: e.target.checked } : item))}
                              className="accent-amber-500 w-4 h-4"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MODOS */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-amber-400 text-sm uppercase">Modos Permitidos</h4>
                      <div className="space-y-2">
                        {modes.map(m => (
                          <div key={m.id} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded border border-zinc-800">
                            <span className="text-sm text-white font-medium">{m.name}</span>
                            <input 
                              type="checkbox" 
                              checked={m.active} 
                              onChange={(e) => setModes(prev => prev.map(item => item.id === m.id ? { ...item, active: e.target.checked } : item))}
                              className="accent-amber-500 w-4 h-4"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: LANÇAR RESULTADOS */}
              {adminTab === 'matches' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                  <h3 className="text-xl font-bold text-white border-b border-zinc-800 pb-3">Lançamento de Resultados</h3>
                  {!tournamentStarted && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300">
                      O torneio ainda não foi iniciado. Realiza o sorteio e utiliza <strong>Iniciar torneio</strong> no Dashboard para desbloquear o lançamento de resultados.
                    </div>
                  )}

                  {selectedMatch ? (
                    <div className="bg-zinc-950 p-6 rounded-xl border border-amber-500/30 space-y-6">
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                        <span className="text-xs font-bold text-amber-400 uppercase">Partida #{selectedMatch.id} - {selectedMatch.bracket}</span>
                        <button onClick={() => setSelectedMatch(null)} className="text-xs text-zinc-400 hover:text-white">Voltar</button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                          <span className="block font-bold text-white mb-2">{getTeam(selectedMatch.team1Id)?.name || 'TBD'}</span>
                          <input 
                            type="number" 
                            id="score1_input"
                            defaultValue={selectedMatch.score1}
                            className="w-20 bg-black text-center font-black text-2xl text-amber-400 border border-zinc-700 rounded p-2 mx-auto"
                          />
                        </div>

                        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                          <span className="block font-bold text-white mb-2">{getTeam(selectedMatch.team2Id)?.name || 'TBD'}</span>
                          <input 
                            type="number" 
                            id="score2_input"
                            defaultValue={selectedMatch.score2}
                            className="w-20 bg-black text-center font-black text-2xl text-amber-400 border border-zinc-700 rounded p-2 mx-auto"
                          />
                        </div>
                      </div>

                      {/* BOTÃO DE SORTEIO DE MAPA/MODO */}
                      <div className="flex justify-between items-center bg-zinc-900 p-3 rounded">
                        <span className="text-xs text-zinc-400">Mapa / Modo: <strong>{selectedMatch.map || 'N/A'}</strong> ({selectedMatch.mode || 'N/A'})</span>
                        <button 
                          onClick={() => handleRandomizeMapAndMode(selectedMatch.id)}
                          className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded hover:bg-amber-500 hover:text-black transition flex items-center gap-1"
                        >
                          <Shuffle size={12} /> Sortear Mapa/Modo
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          const s1 = document.getElementById('score1_input').value;
                          const s2 = document.getElementById('score2_input').value;
                          handleUpdateMatchResult(selectedMatch.id, s1, s2, selectedMatch.map, selectedMatch.mode, selectedMatch.proofImage);
                        }}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-sm rounded shadow-lg transition"
                      >
                        Confirmar e Atualizar Brackets
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matches.map(m => (
                        <div key={m.id} className="bg-zinc-950 p-3 rounded flex justify-between items-center border border-zinc-800">
                          <span className="text-xs text-zinc-400 font-bold">{m.id} ({m.bracket})</span>
                          <span className="text-sm font-bold text-white">
                            {getTeam(m.team1Id)?.name || 'TBD'} vs {getTeam(m.team2Id)?.name || 'TBD'}
                          </span>
                          <button disabled={!tournamentStarted || !m.team1Id || !m.team2Id} onClick={() => setSelectedMatch(m)} className="px-3 py-1 bg-zinc-800 hover:bg-amber-500 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold rounded transition">
                            Editar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN TAB: EDITAR REGULAMENTO */}
              {adminTab === 'rules_edit' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                  <h3 className="text-xl font-bold text-white border-b border-zinc-800 pb-3">Editar Regulamento do Torneio</h3>
                  <textarea 
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    rows={15}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                  <button onClick={() => alert("Regulamento guardado com sucesso!")} className="px-6 py-2.5 bg-amber-500 text-black font-bold text-xs rounded uppercase">
                    Salvar Alterações
                  </button>
                </div>
              )}

              {/* ADMIN TAB: COMUNICADOS */}
              {adminTab === 'announcements_edit' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                  <h3 className="text-xl font-bold text-white border-b border-zinc-800 pb-3">Publicar Comunicado Oficial</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const title = e.target.title.value;
                    const content = e.target.content.value;
                    if (!title || !content) return;
                    setAnnouncements(prev => [{ id: Date.now(), title, content, date: new Date().toLocaleDateString('pt-PT') }, ...prev]);
                    e.target.reset();
                  }} className="space-y-3">
                    <input name="title" placeholder="Título do Comunicado" className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-sm text-white" />
                    <textarea name="content" placeholder="Conteúdo da mensagem..." rows={4} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-sm text-white" />
                    <button type="submit" className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded uppercase">Publicar</button>
                  </form>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL DE INSCRIÇÃO DE DUPLA (2v2) */}
      {/* ------------------------------------------------------------- */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 space-y-6 relative shadow-2xl">
            <button 
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">Inscrição de Dupla (2v2)</h3>
              <p className="text-xs text-zinc-400">Preencha exclusivamente os dados da sua dupla para solicitar vaga.</p>
            </div>

            {registerSuccess ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                <CheckCircle2 size={40} className="mx-auto text-emerald-400 animate-bounce" />
                <h4 className="font-bold text-emerald-400">Inscrição Enviada com Sucesso!</h4>
                <p className="text-xs text-zinc-300">A sua dupla aguarda confirmação pelo administrador.</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">Nome da Dupla *</label>
                  <input 
                    type="text" 
                    required
                    value={registerData.teamName}
                    onChange={(e) => setRegisterData({ ...registerData, teamName: e.target.value })}
                    placeholder="Ex: OpTic VORTEX"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">Nickname Jogador 1 *</label>
                    <input 
                      type="text" 
                      required
                      value={registerData.player1}
                      onChange={(e) => setRegisterData({ ...registerData, player1: e.target.value })}
                      placeholder="Ex: Karma"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">Nickname Jogador 2 *</label>
                    <input 
                      type="text" 
                      required
                      value={registerData.player2}
                      onChange={(e) => setRegisterData({ ...registerData, player2: e.target.value })}
                      placeholder="Ex: Scump"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* CARREGAR LOGÓTIPO DA DUPLA (OPCIONAL) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase">Logótipo da Dupla (Opcional)</label>
                  
                  {registerData.logo ? (
                    <div className="flex items-center space-x-3 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                      <img src={registerData.logo} alt="Preview" className="w-12 h-12 object-cover rounded" />
                      <button 
                        type="button" 
                        onClick={() => setRegisterData({ ...registerData, logo: null })}
                        className="text-xs text-red-400 hover:underline font-semibold"
                      >
                        Remover Imagem
                      </button>
                    </div>
                  ) : (
                    <label className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 border border-dashed border-zinc-700 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-xs text-zinc-300 font-semibold transition">
                      <ImageIcon size={16} className="text-amber-400" /> [ CARREGAR LOGÓTIPO ]
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden" 
                        onChange={(e) => handleLogoUpload(e, (url) => setRegisterData({ ...registerData, logo: url }))}
                      />
                    </label>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase text-sm tracking-wider rounded-lg shadow-lg shadow-amber-500/20 transition pt-3"
                >
                  [ ENVIAR INSCRIÇÃO ]
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-500 space-y-2">
        <p className="font-bold text-zinc-400">{config.orgName} — {config.slogan}</p>
        <p>© 2026 Plataforma Oficial de Gestão de Torneios. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}