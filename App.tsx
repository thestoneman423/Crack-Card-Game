
import React, { useState, useEffect, useCallback } from 'react';
import { Card as CardType, Suit, Rank, PlayerState, GamePhase, Player } from './types';
import { SUITS, RANKS, RANK_VALUES } from './constants';
import { Card } from './components/Card';
import { ShareButton } from './components/ShareButton';

const createDeck = (): CardType[] => {
  const fullRanks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  return SUITS.flatMap(suit =>
    fullRanks.map(rank => ({
      suit,
      rank,
      id: `${rank}-${suit}`,
    }))
  );
};

const shuffleDeck = (deck: CardType[]): CardType[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const sortHand = (hand: CardType[]): CardType[] => {
  return hand.sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank]);
};


const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [user, setUser] = useState<PlayerState>({ hand: [], faceUp: [], faceDown: [] });
  const [computer, setComputer] = useState<PlayerState>({ hand: [], faceUp: [], faceDown: [] });
  const [drawPile, setDrawPile] = useState<CardType[]>([]);
  const [discardPile, setDiscardPile] = useState<CardType[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.USER);
  const [turnPhase, setTurnPhase] = useState<'DRAW' | 'PLAY'>('PLAY');
  const [message, setMessage] = useState('Select 3 cards from your hand to place on the table.');
  const [selectedHandCards, setSelectedHandCards] = useState<CardType[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);

  const getPlayableSource = useCallback((playerState: PlayerState): 'hand' | 'faceUp' | 'faceDown' | null => {
    if (drawPile.length === 0 && playerState.hand.length === 0) {
        if (playerState.faceUp.length > 0) return 'faceUp';
        if (playerState.faceDown.length > 0) return 'faceDown';
    }
    // Hand can be played regardless of draw pile, as long as it's not empty.
    if (playerState.hand.length > 0) return 'hand';
    return null;
  }, [drawPile.length]);


  const setupGame = useCallback(() => {
    const deck = shuffleDeck(createDeck());
    const userFaceDown = deck.splice(0, 3);
    const computerFaceDown = deck.splice(0, 3);
    const userHand = sortHand(deck.splice(0, 6));
    const computerHand = sortHand(deck.splice(0, 6));

    setUser({ hand: userHand, faceUp: [], faceDown: userFaceDown });
    setComputer({ hand: computerHand, faceUp: [], faceDown: computerFaceDown });
    setDrawPile(deck);
    setDiscardPile([]);
    setCurrentPlayer(Player.USER);
    setPhase(GamePhase.SETUP);
    setTurnPhase('PLAY');
    setSelectedHandCards([]);
    setWinner(null);
    setMessage('Select 3 cards from your hand to place on the table.');
  }, []);

  useEffect(() => {
    setupGame();
  }, [setupGame]);

  const handleHandCardSelect = (card: CardType) => {
    if (phase !== GamePhase.SETUP) return;
    setSelectedHandCards(prev => {
      if (prev.find(c => c.id === card.id)) {
        return prev.filter(c => c.id !== card.id);
      }
      if (prev.length < 3) {
        return [...prev, card];
      }
      return prev;
    });
  };

  const confirmSetup = () => {
    if (selectedHandCards.length !== 3) {
      setMessage("You must select exactly 3 cards.");
      return;
    }

    const remainingHand = user.hand.filter(c => !selectedHandCards.find(sc => sc.id === c.id));
    setUser(prev => ({ ...prev, hand: sortHand(remainingHand), faceUp: selectedHandCards }));

    const computerHandCopy = [...computer.hand];
    const computerFaceUp = computerHandCopy.sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]).slice(0, 3);
    const computerRemainingHand = computerHandCopy.filter(c => !computerFaceUp.find(fuc => fuc.id === c.id));
    setComputer(prev => ({ ...prev, hand: sortHand(computerRemainingHand), faceUp: computerFaceUp }));
    
    setPhase(GamePhase.PLAYING);
    setSelectedHandCards([]);
    if (drawPile.length > 0) {
        setTurnPhase('DRAW');
        setMessage("Your turn! Click the draw pile to begin.");
    } else {
        setTurnPhase('PLAY');
        setMessage("Your turn! Play a card.");
    }
  };

  const canPlayOn = (cardToPlay: CardType, topCard: CardType | undefined): boolean => {
    if (!topCard) return true;
    // After a 10 is played, the next card can be anything.
    if (topCard.rank === '10') return true; 
    // 2s and 10s are wild and can be played on anything.
    if (cardToPlay.rank === '2' || cardToPlay.rank === '10') return true;
    return RANK_VALUES[cardToPlay.rank] >= RANK_VALUES[topCard.rank];
  };
    
  const handleCardClick = (card: CardType, source: 'hand' | 'faceUp') => {
      if(currentPlayer !== Player.USER || phase !== GamePhase.PLAYING || turnPhase !== 'PLAY') return;

      const playableSource = getPlayableSource(user);
      if(source !== playableSource){
          if (playableSource) {
            setMessage(`You must play from your ${playableSource} cards first.`);
          }
          return;
      }
      
      setSelectedHandCards(prev => {
          if (prev.find(c => c.id === card.id)) {
              return prev.filter(c => c.id !== card.id);
          }
          if (prev.length > 0 && prev[0].rank !== card.rank) {
              return [card]; // Start new selection with different rank
          }
          return [...prev, card];
      });
  };

  const endTurn = (nextPlayer: Player, newDrawPileLength: number) => {
    setCurrentPlayer(nextPlayer);
    setSelectedHandCards([]);

    if (newDrawPileLength > 0) {
        setTurnPhase('DRAW');
        setMessage(nextPlayer === Player.COMPUTER ? "Computer's turn..." : "Your turn! Click the draw pile.");
    } else {
        setTurnPhase('PLAY');
        setMessage(nextPlayer === Player.COMPUTER ? "Computer's turn..." : "Your turn! Play a card.");
    }
  };

  const handleDrawCard = () => {
    if (currentPlayer !== Player.USER || phase !== GamePhase.PLAYING || turnPhase !== 'DRAW' || drawPile.length === 0) {
        return;
    }
    const newDrawPile = [...drawPile];
    const drawnCard = newDrawPile.shift()!;
    const newUserHand = sortHand([...user.hand, drawnCard]);
    
    setUser(prev => ({ ...prev, hand: newUserHand }));
    setDrawPile(newDrawPile);
    setTurnPhase('PLAY');
    setMessage('Select card(s) to play.');
  };
  
  const checkForWin = (player: Player, playerState: PlayerState) => {
    if (playerState.hand.length === 0 && playerState.faceUp.length === 0 && playerState.faceDown.length === 0) {
        setWinner(player);
        setPhase(GamePhase.GAME_OVER);
        setMessage(player === Player.USER ? "Congratulations, you win!" : "The computer wins!");
        return true;
    }
    return false;
  };

  const replenishHand = (hand: CardType[], currentDrawPile: CardType[]): { newHand: CardType[], newDrawPile: CardType[] } => {
      let newHand = [...hand];
      let newDrawPile = [...currentDrawPile];
      while (newHand.length < 3 && newDrawPile.length > 0) {
          newHand.push(newDrawPile.shift()!);
      }
      return { newHand: sortHand(newHand), newDrawPile };
  }
  
  const afterPlayUpdate = (player: Player, newPlayerState: PlayerState, goAgain: boolean, currentDrawPile: CardType[]) => {
      let finalPlayerState = { ...newPlayerState };
      let remainingDrawPile = [...currentDrawPile];
      
      if (remainingDrawPile.length > 0 && finalPlayerState.hand.length < 3) {
          const { newHand, newDrawPile } = replenishHand(finalPlayerState.hand, remainingDrawPile);
          finalPlayerState.hand = newHand;
          remainingDrawPile = newDrawPile;
      }

      const stateSetter = player === Player.USER ? setUser : setComputer;
      stateSetter(finalPlayerState);
      setDrawPile(remainingDrawPile);
      
      if (checkForWin(player, finalPlayerState)) return;
      
      if (goAgain) {
          setCurrentPlayer(player);
          setSelectedHandCards([]);
          if (remainingDrawPile.length > 0) {
              setTurnPhase('DRAW');
              setMessage(player === Player.USER ? "Wild card! Click the draw pile for your bonus turn." : "Computer gets another turn...");
          } else {
              setTurnPhase('PLAY');
              setMessage(player === Player.USER ? "Wild card! Play again." : "Computer gets another turn...");
          }
      } else {
          endTurn(player === Player.USER ? Player.COMPUTER : Player.USER, remainingDrawPile.length);
      }
  }

  const playCards = (cards: CardType[], source: 'hand' | 'faceUp') => {
    if (cards.length === 0) return;
    
    const topCard = discardPile[discardPile.length - 1];
    if (!canPlayOn(cards[0], topCard)) {
      setMessage(`Invalid move. You must play a card of the same rank or higher.`);
      setSelectedHandCards([]);
      return;
    }
    
    const goAgain = cards[0].rank === '2' || cards[0].rank === '10' || cards.length === 4;
    const clearsPile = cards[0].rank === '2' || cards.length === 4;

    const newDiscardPile = clearsPile ? [] : [...discardPile, ...cards];
    setDiscardPile(newDiscardPile);

    const newSourceCards = user[source].filter(c => !cards.find(sc => sc.id === c.id));
    const newUserState = { ...user, [source]: newSourceCards };
    
    afterPlayUpdate(Player.USER, newUserState, goAgain, drawPile);
  };
  
  const playFaceDownCard = (card: CardType) => {
      if(currentPlayer !== Player.USER || getPlayableSource(user) !== 'faceDown' || turnPhase !== 'PLAY') return;

      const topCard = discardPile[discardPile.length - 1];
      const newFaceDown = user.faceDown.filter(c => c.id !== card.id);
      
      if (canPlayOn(card, topCard)) {
          const goAgain = card.rank === '2' || card.rank === '10';
          const clearsPile = card.rank === '2';
          const newDiscardPile = clearsPile ? [] : [...discardPile, card];
          setDiscardPile(newDiscardPile);
          
          const newUserState = { ...user, faceDown: newFaceDown };
          afterPlayUpdate(Player.USER, newUserState, goAgain, drawPile);
      } else {
          const newHand = sortHand([...user.hand, ...discardPile, card]);
          setUser(prev => ({ ...prev, hand: newHand, faceDown: newFaceDown }));
          setDiscardPile([]);
          setMessage("Bad luck! Your card was too low. You picked up the pile.");
          endTurn(Player.COMPUTER, drawPile.length);
      }
  };

  const pickUpPile = () => {
    if (currentPlayer !== Player.USER || phase !== GamePhase.PLAYING || discardPile.length === 0 || turnPhase !== 'PLAY') return;
    
    const playableSource = getPlayableSource(user);
    if(playableSource !== 'hand') {
        setMessage("You can only pick up the pile when playing from your hand.");
        return;
    }

    const newHand = sortHand([...user.hand, ...discardPile]);
    setUser(prev => ({...prev, hand: newHand}));
    setDiscardPile([]);
    setMessage("You picked up the pile.");
    endTurn(Player.COMPUTER, drawPile.length);
  };

  const runComputerTurn = useCallback(() => {
    if (winner) return;

    // Phase 1: Draw (with a small delay)
    setTimeout(() => {
        let handAfterDraw = [...computer.hand];
        let drawPileAfterDraw = [...drawPile];

        if (drawPileAfterDraw.length > 0) {
            setMessage("Computer is drawing a card...");
            const drawnCard = drawPileAfterDraw.shift()!;
            handAfterDraw.push(drawnCard);
            handAfterDraw = sortHand(handAfterDraw);
        }

        // Phase 2: Play (after another delay)
        setTimeout(() => {
            const computerStateAfterDraw = { ...computer, hand: handAfterDraw };
            let source = getPlayableSource(computerStateAfterDraw);
            const topCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : undefined;
            
            let play: CardType[] = [];

            if (source === 'hand' || source === 'faceUp') {
                const cardSource = source === 'hand' ? computerStateAfterDraw.hand : computerStateAfterDraw.faceUp;
                const possiblePlays: CardType[][] = [];

                for (const card of cardSource) {
                    if (canPlayOn(card, topCard)) {
                        const sameRank = cardSource.filter(c => c.rank === card.rank);
                        possiblePlays.push(sameRank);
                    }
                }
                
                if (possiblePlays.length > 0) {
                    possiblePlays.sort((a, b) => RANK_VALUES[a[0].rank] - RANK_VALUES[b[0].rank]);
                    const bestPlay = possiblePlays.find(p => p[0].rank !== '2' && p[0].rank !== '10') || possiblePlays[0];
                    play = bestPlay;
                }
            } else if (source === 'faceDown') {
                const cardToPlay = computerStateAfterDraw.faceDown[Math.floor(Math.random() * computerStateAfterDraw.faceDown.length)];
                play = [cardToPlay];
            }

            // Execute Play
            if (play.length > 0 && source !== null) {
                setMessage(`Computer plays ${play.length > 1 ? play.length + 'x ' : ''}${play[0].rank}...`);
                if (source === 'faceDown') {
                    const card = play[0];
                    const newFaceDown = computerStateAfterDraw.faceDown.filter(c => c.id !== card.id);
                    if (canPlayOn(card, topCard)) {
                        const goAgain = card.rank === '2' || card.rank === '10';
                        const clearsPile = card.rank === '2';
                        setDiscardPile(clearsPile ? [] : [...discardPile, card]);
                        const newComputerState = { ...computerStateAfterDraw, faceDown: newFaceDown };
                        afterPlayUpdate(Player.COMPUTER, newComputerState, goAgain, drawPileAfterDraw);
                    } else {
                        const newHand = sortHand([...computerStateAfterDraw.hand, ...discardPile, card]);
                        setComputer({ ...computer, hand: newHand, faceDown: newFaceDown });
                        setDrawPile(drawPileAfterDraw);
                        setDiscardPile([]);
                        setMessage("Computer played a low card and picked up the pile.");
                        endTurn(Player.USER, drawPileAfterDraw.length);
                    }
                } else { // 'hand' or 'faceUp'
                    const goAgain = play[0].rank === '2' || play[0].rank === '10' || play.length === 4;
                    const clearsPile = play[0].rank === '2' || play.length === 4;
                    setDiscardPile(clearsPile ? [] : [...discardPile, ...play]);
                    
                    const newSourceCards = computerStateAfterDraw[source].filter(c => !play.find(pc => pc.id === c.id));
                    const newComputerState = { ...computerStateAfterDraw, [source]: newSourceCards };
                    afterPlayUpdate(Player.COMPUTER, newComputerState, goAgain, drawPileAfterDraw);
                }
            } else { // No valid play, pick up pile
                if (discardPile.length > 0) {
                    const newHand = sortHand([...computerStateAfterDraw.hand, ...discardPile]);
                    setComputer({ ...computerStateAfterDraw, hand: newHand });
                    setDrawPile(drawPileAfterDraw);
                    setDiscardPile([]);
                    setMessage("Computer couldn't play and picked up the pile.");
                }
                endTurn(Player.USER, drawPileAfterDraw.length);
            }
        }, 1500);
    }, 750);
  }, [winner, computer, drawPile, discardPile, getPlayableSource]);


  useEffect(() => {
    if (currentPlayer === Player.COMPUTER && phase === GamePhase.PLAYING && !winner) {
      runComputerTurn();
    }
  }, [currentPlayer, phase, winner, runComputerTurn]);

  const renderPlayerArea = (
      playerState: PlayerState,
      playerType: Player
  ) => {
      const isUser = playerType === Player.USER;
      const playableSource = getPlayableSource(user);

      return (
          <div className="w-full flex flex-col items-center space-y-4 my-4">
              {/* Table Cards */}
              <div className="flex space-x-2 justify-center">
                  {playerState.faceDown.map((card, i) => (
                      <Card 
                          key={card.id} 
                          card={card} 
                          isFaceDown={true}
                          onClick={isUser && playableSource === 'faceDown' && turnPhase === 'PLAY' ? () => playFaceDownCard(card) : undefined} 
                       />
                  ))}
              </div>
              <div className="flex space-x-2 justify-center -mt-16">
                  {playerState.faceUp.map(card => (
                      <Card 
                          key={card.id} 
                          card={card} 
                          isSelected={isUser && selectedHandCards.some(c => c.id === card.id)}
                          onClick={isUser && playableSource === 'faceUp' ? () => handleCardClick(card, 'faceUp') : undefined}
                      />
                  ))}
              </div>
              {/* Hand */}
              <div className={`flex justify-center flex-wrap min-h-[8.5rem] sm:min-h-[10.5rem] items-end`}>
                  {playerState.hand.map((card, i) => (
                      <Card
                          key={card.id}
                          card={card}
                          isFaceDown={!isUser}
                          isSelected={isUser && selectedHandCards.some(c => c.id === card.id)}
                          onClick={isUser && playableSource === 'hand' ? () => handleCardClick(card, 'hand') : undefined}
                          className="mx-[-20px] sm:mx-[-30px]"
                      />
                  ))}
              </div>
          </div>
      );
  };
  
  const renderOpponentArea = () => {
    return (
        <div className="w-full flex flex-col items-center space-y-4 my-4 opacity-80">
            <div className="flex justify-center flex-wrap min-h-[8.5rem] sm:min-h-[10.5rem] items-start">
                {computer.hand.map((card, i) => (
                    <Card
                        key={i}
                        isFaceDown={true}
                        className="mx-[-20px] sm:mx-[-30px]"
                    />
                ))}
            </div>
             <div className="flex space-x-2 justify-center -mb-16">
                  {computer.faceUp.map(card => (
                      <Card key={card.id} card={card} />
                  ))}
              </div>
              <div className="flex space-x-2 justify-center">
                  {Array.from({length: computer.faceDown.length}).map((_, i) => (
                       <Card key={i} isFaceDown={true} />
                  ))}
              </div>
        </div>
    )
  }

  const playableSource = getPlayableSource(user);
  const topCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : undefined;

  const userHasPlayableHandCard = playableSource === 'hand' && !!topCard
      ? user.hand.some(card => canPlayOn(card, topCard))
      : true;

  const userMustPickUpPile = 
      currentPlayer === Player.USER &&
      phase === GamePhase.PLAYING &&
      turnPhase === 'PLAY' &&
      playableSource === 'hand' &&
      !!topCard &&
      !userHasPlayableHandCard;

  const displayMessage = userMustPickUpPile ? "No playable cards. You must pick up the pile." : message;


  if (phase === GamePhase.SETUP) {
    return (
      <div className="min-h-screen bg-green-800 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">Crack Card Game Setup</h1>
        <p className="mb-6 text-lg">{message}</p>
        <div className="flex flex-wrap justify-center mb-6">
            {user.hand.map(card => (
                <Card 
                    key={card.id} 
                    card={card} 
                    onClick={() => handleHandCardSelect(card)} 
                    isSelected={selectedHandCards.some(c => c.id === card.id)}
                    className="m-1"
                />
            ))}
        </div>
        <button 
            onClick={confirmSetup} 
            disabled={selectedHandCards.length !== 3}
            className="px-8 py-4 bg-yellow-500 text-green-900 font-bold rounded-lg shadow-lg text-xl disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors"
        >
            Confirm ({selectedHandCards.length}/3)
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 text-white flex flex-col justify-between p-4 overflow-hidden relative font-sans">
      <ShareButton/>
      {winner && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
              <h2 className="text-6xl font-bold mb-4 animate-pulse">{winner === Player.USER ? 'You Win!' : 'You Lose!'}</h2>
              <button onClick={setupGame} className="px-8 py-4 bg-yellow-500 text-green-900 font-bold rounded-lg shadow-lg text-xl hover:bg-yellow-400 transition-colors">
                  Play Again
              </button>
          </div>
      )}
      
      {renderOpponentArea()}

      <div className="flex justify-center items-center space-x-4 sm:space-x-8 my-4">
        <div className="flex flex-col items-center">
          <Card
            isFaceDown={drawPile.length > 0}
            onClick={handleDrawCard}
            className={currentPlayer === Player.USER && turnPhase === 'DRAW' && drawPile.length > 0 ? 'cursor-pointer ring-4 ring-yellow-400 animate-pulse' : ''}
          />
          <p className="mt-2 font-bold">Draw ({drawPile.length})</p>
        </div>
        <div className="flex flex-col items-center">
          <Card card={discardPile[discardPile.length-1]} />
          <p className="mt-2 font-bold">Discard ({discardPile.length})</p>
        </div>
      </div>
      
       <div className="w-full text-center my-2">
            <p className="text-xl font-semibold bg-black/30 rounded-full px-4 py-2 inline-block ">{displayMessage}</p>
        </div>

      {renderPlayerArea(user, Player.USER)}
      
      <div className="flex justify-center space-x-4 mt-2">
        <button
          onClick={() => playCards(selectedHandCards, (getPlayableSource(user) as 'hand' | 'faceUp'))}
          disabled={userMustPickUpPile || selectedHandCards.length === 0 || currentPlayer !== Player.USER || turnPhase !== 'PLAY'}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
        >
          Play Selected
        </button>
        <button
          onClick={pickUpPile}
          disabled={discardPile.length === 0 || currentPlayer !== Player.USER || getPlayableSource(user) !== 'hand' || turnPhase !== 'PLAY'}
          className={`px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-red-500 transition-colors ${userMustPickUpPile ? 'animate-pulse ring-4 ring-yellow-400' : ''}`}
        >
          Pick Up Pile
        </button>
      </div>
    </main>
  );
};

export default App;
