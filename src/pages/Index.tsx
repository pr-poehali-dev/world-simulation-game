import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface Country {
  id: string;
  name: string;
  color: string;
  population: number;
  economy: number;
  military: number;
  territories: Territory[];
  capital: { x: number; y: number };
  cities: { x: number; y: number }[];
  weapons: WeaponType[];
  diplomacy: { allies: string[]; enemies: string[] };
  aiPersonality: 'peaceful' | 'aggressive' | 'expansionist' | 'defensive' | 'neutral';
  weaponLevel: number;
}

interface Territory {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  countryId: string | null;
}

interface WeaponType {
  name: string;
  era: 'Ancient' | 'Medieval' | 'Industrial' | 'Modern' | 'Nuclear';
  count: number;
}

interface WorldStats {
  totalPopulation: number;
  totalEconomy: number;
  totalMilitary: number;
  date: { year: number; month: number; day: number };
}

interface WarEvent {
  id: string;
  attacker: string;
  defender: string;
  result: string;
  date: string;
}

const WEAPON_EVOLUTION = {
  Ancient: ['Копье', 'Меч', 'Щит', 'Лук'],
  Medieval: ['Катапульта', 'Арбалет', 'Рыцарская броня', 'Требушет'],
  Industrial: ['Мушкет', 'Пушка', 'Паровой корабль', 'Железнодорожные войска'],
  Modern: ['Винтовка', 'Пулемет', 'Танк', 'Самолет'],
  Nuclear: ['Ядерная бомба', 'Ракета', 'Подводная лодка', 'Спутник']
};

const SPEED_MODES = [
  { name: 'Пауза', description: 'Пауза', multiplier: 0 },
  { name: '1x', description: '1 день/сек', multiplier: 1 },
  { name: '10x', description: '10 дней/сек', multiplier: 10 },
  { name: '365x', description: '1 год/сек', multiplier: 365 },
  { name: '3650x', description: '10 лет/сек', multiplier: 3650 },
  { name: '36500x', description: '100 лет/сек', multiplier: 36500 }
];

const COUNTRY_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'];

const Index = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [worldStats, setWorldStats] = useState<WorldStats>({
    totalPopulation: 0,
    totalEconomy: 0,
    totalMilitary: 0,
    date: { year: 0, month: 1, day: 1 }
  });
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [warEvents, setWarEvents] = useState<WarEvent[]>([]);
  const [speedMode, setSpeedMode] = useState(0);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Инициализация территорий карты мира
  useEffect(() =&gt; {
    const initTerritories = () =&gt; {
      const newTerritories: Territory[] = [];
      // Создаем более плотную сетку территорий для лучшего геймплея
      const rows = 30;
      const cols = 60;
      const territoryWidth = 1200 / cols;
      const territoryHeight = 600 / rows;

      for (let i = 0; i &lt; rows; i++) {
        for (let j = 0; j &lt; cols; j++) {
          // Создаем континенты - меньше океанов, больше суши
          const isLand = Math.random() &gt; 0.2; // 80% суши
          if (isLand) {
            newTerritories.push({
              id: `territory-${i}-${j}`,
              x: j * territoryWidth,
              y: i * territoryHeight,
              width: territoryWidth,
              height: territoryHeight,
              countryId: null
            });
          }
        }
      }
      setTerritories(newTerritories);
    };

    initTerritories();
  }, []);

  // Создание новой страны при клике на карту
  const handleMapClick = (event: React.MouseEvent) =&gt; {
    if (!mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Находим территорию под курсором
    const clickedTerritory = territories.find(t =&gt; 
      x &gt;= t.x && x &lt;= t.x + t.width && 
      y &gt;= t.y && y &lt;= t.y + t.height && 
      !t.countryId
    );

    if (clickedTerritory) {
      const personalities: Country['aiPersonality'][] = ['peaceful', 'aggressive', 'expansionist', 'defensive', 'neutral'];
      const countryNames = ['Атлантида', 'Лемурия', 'Элдорадо', 'Шангри-Ла', 'Валгалла', 'Асгард', 'Олимп', 'Авалон', 'Утопия', 'Эдем'];
      
      const newCountry: Country = {
        id: `country-${Date.now()}`,
        name: countryNames[countries.length % countryNames.length] || `Страна ${countries.length + 1}`,
        color: COUNTRY_COLORS[countries.length % COUNTRY_COLORS.length],
        population: Math.floor(Math.random() * 1000000) + 100000,
        economy: Math.floor(Math.random() * 50000) + 10000,
        military: Math.floor(Math.random() * 10000) + 1000,
        territories: [clickedTerritory],
        capital: { x: clickedTerritory.x + clickedTerritory.width / 2, y: clickedTerritory.y + clickedTerritory.height / 2 },
        cities: [
          { x: clickedTerritory.x + Math.random() * clickedTerritory.width, y: clickedTerritory.y + Math.random() * clickedTerritory.height }
        ],
        weapons: [
          { name: 'Копье', era: 'Ancient', count: Math.floor(Math.random() * 1000) + 100 },
          { name: 'Меч', era: 'Ancient', count: Math.floor(Math.random() * 500) + 50 }
        ],
        diplomacy: { allies: [], enemies: [] },
        aiPersonality: personalities[Math.floor(Math.random() * personalities.length)],
        weaponLevel: 0
      };

      // Обновляем территорию
      setTerritories(prev =&gt; prev.map(t =&gt; 
        t.id === clickedTerritory.id ? { ...t, countryId: newCountry.id } : t
      ));

      setCountries(prev =&gt; [...prev, newCountry]);
      setSelectedCountry(newCountry);
    }
  };

  // Симуляция мира
  useEffect(() =&gt; {
    if (isSimulationRunning && countries.length &gt; 0 && speedMode &gt; 0) {
      const speed = SPEED_MODES[speedMode].multiplier;
      intervalRef.current = setInterval(() =&gt; {
        // Обновляем дату  
        setWorldStats(prev =&gt; {
          const newDay = prev.date.day + speed;
          const newMonth = prev.date.month + Math.floor(newDay / 30);
          const newYear = prev.date.year + Math.floor(newMonth / 12);
          
          return {
            ...prev,
            date: {
              year: newYear,
              month: (newMonth - 1) % 12 + 1,
              day: (newDay - 1) % 30 + 1
            }
          };
        });

        // Обновляем страны
        setCountries(prev =&gt; prev.map(country =&gt; {
          const populationGrowth = Math.floor(country.population * 0.001 * speed);
          const economyGrowth = Math.floor(country.economy * 0.002 * speed);
          const militaryGrowth = Math.floor(country.military * 0.001 * speed);
          
          // Эволюция оружия на основе времени и экономики
          let newWeaponLevel = country.weaponLevel;
          const weaponEvolutionChance = Math.random() * (country.economy / 100000) * (speed / 100);
          if (weaponEvolutionChance &gt; 0.1 && newWeaponLevel &lt; Object.keys(WEAPON_EVOLUTION).length - 1) {
            newWeaponLevel++;
          }
          
          // Обновление оружия по уровню
          const weaponEras = Object.keys(WEAPON_EVOLUTION) as (keyof typeof WEAPON_EVOLUTION)[];
          const currentEra = weaponEras[newWeaponLevel];
          const newWeapons = WEAPON_EVOLUTION[currentEra].map(weaponName =&gt; ({
            name: weaponName,
            era: currentEra,
            count: Math.floor(Math.random() * 1000) + 100
          }));

          return {
            ...country,
            population: country.population + populationGrowth,
            economy: country.economy + economyGrowth,
            military: country.military + militaryGrowth,
            weaponLevel: newWeaponLevel,
            weapons: newWeapons,
            // Добавляем новые города по мере роста населения
            cities: country.population &gt; country.cities.length * 500000 ? 
              [...country.cities, {
                x: Math.random() * 1200,
                y: Math.random() * 600
              }] : country.cities
          };
        }));

        // Симуляция расширения территорий и войн
        setCountries(prevCountries =&gt; {
          return prevCountries.map(country =&gt; {
            // Случайное расширение территорий
            if (Math.random() &lt; 0.15 && territories.length &gt; 0) {
              const adjacentTerritories = territories.filter(t =&gt; {
                if (t.countryId) return false;
                
                // Проверяем соседство с существующими территориями страны
                return country.territories.some(ownedTerritory =&gt; {
                  const ownedT = territories.find(owned =&gt; owned.id === ownedTerritory.id);
                  if (!ownedT) return false;
                  
                  const distance = Math.sqrt(
                    Math.pow(t.x - ownedT.x, 2) + Math.pow(t.y - ownedT.y, 2)
                  );
                  return distance &lt;= 50; // Соседние территории
                });
              });
              
              if (adjacentTerritories.length &gt; 0) {
                const targetTerritory = adjacentTerritories[Math.floor(Math.random() * adjacentTerritories.length)];
                
                // Обновляем территории
                setTerritories(prevTerr =&gt; prevTerr.map(t =&gt; 
                  t.id === targetTerritory.id ? { ...t, countryId: country.id } : t
                ));
                
                // Добавляем событие захвата
                const expansionEvent: WarEvent = {
                  id: `expansion-${Date.now()}`,
                  attacker: country.name,
                  defender: 'Нейтральная территория',
                  result: 'территория захвачена',
                  date: new Date().toLocaleString('ru-RU')
                };
                
                setWarEvents(prev =&gt; [expansionEvent, ...prev.slice(0, 9)]);
                
                return {
                  ...country,
                  territories: [...country.territories, targetTerritory]
                };
              }
            }
            
            // Ядерные удары (только для стран с ядерным оружием)
            if (Math.random() &lt; 0.01 && country.weaponLevel &gt;= 4 && prevCountries.length &gt; 1) {
              const hasNuclearWeapons = country.weapons.some(w =&gt; w.name.includes('Ядерная'));
              
              if (hasNuclearWeapons) {
                const enemies = prevCountries.filter(c =&gt; c.id !== country.id && c.cities.length &gt; 0);
                
                if (enemies.length &gt; 0) {
                  const targetCountry = enemies[Math.floor(Math.random() * enemies.length)];
                  const targetCity = targetCountry.cities[Math.floor(Math.random() * targetCountry.cities.length)];
                  
                  // Уничтожаем город
                  setCountries(prevC =&gt; prevC.map(c =&gt; {
                    if (c.id === targetCountry.id) {
                      const newCities = c.cities.filter(city =&gt; city !== targetCity);
                      const populationLoss = Math.floor(c.population * 0.3); // 30% потерь населения
                      
                      return {
                        ...c,
                        cities: newCities,
                        population: Math.max(0, c.population - populationLoss),
                        economy: Math.floor(c.economy * 0.7),
                        military: Math.floor(c.military * 0.8)
                      };
                    }
                    return c;
                  }));
                  
                  const nuclearEvent: WarEvent = {
                    id: `nuclear-${Date.now()}`,
                    attacker: country.name,
                    defender: targetCountry.name,
                    result: 'ядерный удар - город уничтожен!',
                    date: new Date().toLocaleString('ru-RU')
                  };
                  
                  setWarEvents(prev =&gt; [nuclearEvent, ...prev.slice(0, 9)]);
                }
              }
            }
            
            // Обычные войны между странами
            if (Math.random() &lt; 0.05 && prevCountries.length &gt; 1) {
              const enemies = prevCountries.filter(c =&gt; c.id !== country.id);
              if (enemies.length &gt; 0) {
                const enemy = enemies[Math.floor(Math.random() * enemies.length)];
                
                const warEvent: WarEvent = {
                  id: `war-${Date.now()}`,
                  attacker: country.name,
                  defender: enemy.name,
                  result: Math.random() &gt; 0.5 ? 'победа атакующего' : 'победа защитника',
                  date: new Date().toLocaleString('ru-RU')
                };
                
                setWarEvents(prev =&gt; [warEvent, ...prev.slice(0, 9)]);
              }
            }
            
            // Система независимости территорий
            if (Math.random() &lt; 0.02 && country.territories.length &gt; 3) {
              // Выбираем случайную территорию для отделения
              const territoryToSeparate = country.territories[Math.floor(Math.random() * country.territories.length)];
              
              // Создаем новую независимую страну
              const separatistNames = ['Республика Либертас', 'Новая Надежда', 'Свободная Республика', 'Независимость'];
              const personalities: Country['aiPersonality'][] = ['peaceful', 'aggressive', 'expansionist', 'defensive', 'neutral'];
              
              const newCountry: Country = {
                id: `country-separated-${Date.now()}`,
                name: separatistNames[Math.floor(Math.random() * separatistNames.length)],
                color: COUNTRY_COLORS[prevCountries.length % COUNTRY_COLORS.length],
                population: Math.floor(country.population * 0.3), // 30% населения
                economy: Math.floor(country.economy * 0.2),
                military: Math.floor(country.military * 0.15),
                territories: [territoryToSeparate],
                capital: { x: territoryToSeparate.x + territoryToSeparate.width / 2, y: territoryToSeparate.y + territoryToSeparate.height / 2 },
                cities: [{ x: territoryToSeparate.x + Math.random() * territoryToSeparate.width, y: territoryToSeparate.y + Math.random() * territoryToSeparate.height }],
                weapons: country.weapons.map(w =&gt; ({ ...w, count: Math.floor(w.count * 0.2) })),
                diplomacy: { allies: [], enemies: [country.id] },
                aiPersonality: personalities[Math.floor(Math.random() * personalities.length)],
                weaponLevel: Math.max(0, country.weaponLevel - 1) // Немного отстают в технологиях
              };
              
              // Обновляем старую страну
              setCountries(prev =&gt; [...prev, newCountry]);
              
              // Обновляем территории
              setTerritories(prevTerr =&gt; prevTerr.map(t =&gt; 
                t.id === territoryToSeparate.id ? { ...t, countryId: newCountry.id } : t
              ));
              
              // Событие о независимости
              const independenceEvent: WarEvent = {
                id: `independence-${Date.now()}`,
                attacker: newCountry.name,
                defender: country.name,
                result: 'объявлена независимость',
                date: new Date().toLocaleString('ru-RU')
              };
              
              setWarEvents(prev =&gt; [independenceEvent, ...prev.slice(0, 9)]);
              
              return {
                ...country,
                territories: country.territories.filter(t =&gt; t.id !== territoryToSeparate.id),
                population: Math.floor(country.population * 0.7),
                economy: Math.floor(country.economy * 0.8),
                military: Math.floor(country.military * 0.85)
              };
            }
            
            return country;
          });
        });
      }, 1000);
    }

    return () =&gt; {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSimulationRunning, speedMode, countries.length]);

  // Подсчет общей статистики
  useEffect(() =&gt; {
    const totalPopulation = countries.reduce((sum, country) =&gt; sum + country.population, 0);
    const totalEconomy = countries.reduce((sum, country) =&gt; sum + country.economy, 0);
    const totalMilitary = countries.reduce((sum, country) =&gt; sum + country.military, 0);

    setWorldStats(prev =&gt; ({
      ...prev,
      totalPopulation,
      totalEconomy,
      totalMilitary
    }));
  }, [countries]);

  const formatNumber = (num: number) =&gt; {
    if (num &gt;= 1e9) return `${(num / 1e9).toFixed(1)}Б`;
    if (num &gt;= 1e6) return `${(num / 1e6).toFixed(1)}М`;
    if (num &gt;= 1e3) return `${(num / 1e3).toFixed(1)}К`;
    return num.toString();
  };

  return (
    &lt;div className="min-h-screen bg-slate-900 text-white font-roboto"&gt;
      {/* Верхняя панель с датой и статистикой */}
      &lt;div className="bg-slate-800 border-b border-slate-700 p-4"&gt;
        &lt;div className="flex justify-between items-center max-w-7xl mx-auto"&gt;
          &lt;div className="text-xl font-bold text-blue-400"&gt;
            {worldStats.date.day}.{worldStats.date.month.toString().padStart(2, '0')}.{worldStats.date.year} год
          &lt;/div&gt;
          
          &lt;div className="flex gap-8 items-center"&gt;
            &lt;div className="flex items-center gap-2"&gt;
              &lt;Icon name="Users" size={20} className="text-green-400" /&gt;
              &lt;span className="text-green-400 font-bold"&gt;{formatNumber(worldStats.totalPopulation)}&lt;/span&gt;
            &lt;/div&gt;
            &lt;div className="flex items-center gap-2"&gt;
              &lt;Icon name="DollarSign" size={20} className="text-yellow-400" /&gt;
              &lt;span className="text-yellow-400 font-bold"&gt;{formatNumber(worldStats.totalEconomy)}&lt;/span&gt;
            &lt;/div&gt;
            &lt;div className="flex items-center gap-2"&gt;
              &lt;Icon name="Shield" size={20} className="text-red-400" /&gt;
              &lt;span className="text-red-400 font-bold"&gt;{formatNumber(worldStats.totalMilitary)}&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;div className="flex h-[calc(100vh-80px)]"&gt;
        {/* Левая панель */}
        &lt;div className="w-80 bg-slate-800 border-r border-slate-700 overflow-y-auto"&gt;
          {/* Контроль времени */}
          &lt;Card className="m-4 bg-slate-700 border-slate-600"&gt;
            &lt;CardHeader className="pb-3"&gt;
              &lt;CardTitle className="text-lg text-white flex items-center gap-2"&gt;
                &lt;Icon name="Clock" size={20} /&gt;
                Контроль времени
              &lt;/CardTitle&gt;
            &lt;/CardHeader&gt;
            &lt;CardContent className="space-y-3"&gt;
              &lt;div className="flex gap-2"&gt;
                &lt;Button
                  onClick={() =&gt; setIsSimulationRunning(!isSimulationRunning)}
                  variant={isSimulationRunning ? "destructive" : "default"}
                  className="flex-1"
                &gt;
                  &lt;Icon name={isSimulationRunning ? "Pause" : "Play"} size={16} className="mr-2" /&gt;
                  {isSimulationRunning ? 'Пауза' : 'Старт'}
                &lt;/Button&gt;
              &lt;/div&gt;
              &lt;div className="grid grid-cols-3 gap-1"&gt;
                {SPEED_MODES.map((mode, index) =&gt; (
                  &lt;Button
                    key={index}
                    onClick={() =&gt; {
                      setSpeedMode(index);
                      if (index === 0) setIsSimulationRunning(false);
                      else if (!isSimulationRunning) setIsSimulationRunning(true);
                    }}
                    variant={speedMode === index ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    disabled={index === 0 && !isSimulationRunning}
                  &gt;
                    {mode.name}
                  &lt;/Button&gt;
                ))}
              &lt;/div&gt;
              &lt;p className="text-xs text-slate-400 text-center"&gt;
                {SPEED_MODES[speedMode].description}
              &lt;/p&gt;
            &lt;/CardContent&gt;
          &lt;/Card&gt;

          {/* Информация о выбранной стране */}
          {selectedCountry && (
            &lt;Card className="m-4 bg-slate-700 border-slate-600"&gt;
              &lt;CardHeader className="pb-3"&gt;
                &lt;CardTitle className="text-lg text-white flex items-center gap-2"&gt;
                  &lt;div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedCountry.color }}
                  &gt;&lt;/div&gt;
                  {selectedCountry.name}
                &lt;/CardTitle&gt;
              &lt;/CardHeader&gt;
              &lt;CardContent className="space-y-3"&gt;
                &lt;div className="space-y-2"&gt;
                  &lt;div className="flex justify-between text-sm"&gt;
                    &lt;span className="text-slate-400"&gt;Население:&lt;/span&gt;
                    &lt;span className="text-green-400"&gt;{formatNumber(selectedCountry.population)}&lt;/span&gt;
                  &lt;/div&gt;
                  &lt;div className="flex justify-between text-sm"&gt;
                    &lt;span className="text-slate-400"&gt;Экономика:&lt;/span&gt;
                    &lt;span className="text-yellow-400"&gt;{formatNumber(selectedCountry.economy)}&lt;/span&gt;
                  &lt;/div&gt;
                  &lt;div className="flex justify-between text-sm"&gt;
                    &lt;span className="text-slate-400"&gt;Армия:&lt;/span&gt;
                    &lt;span className="text-red-400"&gt;{formatNumber(selectedCountry.military)}&lt;/span&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
                
                &lt;Separator className="bg-slate-600" /&gt;
                
                &lt;div&gt;
                  &lt;h4 className="text-sm font-semibold text-white mb-2"&gt;Вооружение ({Object.keys(WEAPON_EVOLUTION)[selectedCountry.weaponLevel]} эра):&lt;/h4&gt;
                  &lt;div className="space-y-1"&gt;
                    {selectedCountry.weapons.slice(0, 4).map((weapon, idx) =&gt; (
                      &lt;div key={idx} className="flex justify-between text-xs"&gt;
                        &lt;span className="text-slate-400"&gt;{weapon.name}:&lt;/span&gt;
                        &lt;Badge variant="outline" className="text-xs"&gt;
                          {formatNumber(weapon.count)}
                        &lt;/Badge&gt;
                      &lt;/div&gt;
                    ))}
                  &lt;/div&gt;
                  &lt;div className="mt-2 text-xs text-slate-500"&gt;
                    ИИ тип: {selectedCountry.aiPersonality === 'peaceful' ? 'Миролюбивый' : 
                             selectedCountry.aiPersonality === 'aggressive' ? 'Агрессивный' :
                             selectedCountry.aiPersonality === 'expansionist' ? 'Экспансионист' :
                             selectedCountry.aiPersonality === 'defensive' ? 'Оборонительный' : 'Нейтральный'}
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/CardContent&gt;
            &lt;/Card&gt;
          )}

          {/* Лог событий */}
          &lt;Card className="m-4 bg-slate-700 border-slate-600"&gt;
            &lt;CardHeader className="pb-3"&gt;
              &lt;CardTitle className="text-lg text-white flex items-center gap-2"&gt;
                &lt;Icon name="Scroll" size={20} /&gt;
                События
              &lt;/CardTitle&gt;
            &lt;/CardHeader&gt;
            &lt;CardContent&gt;
              &lt;div className="space-y-2 max-h-40 overflow-y-auto"&gt;
                {warEvents.length === 0 ? (
                  &lt;p className="text-slate-400 text-sm"&gt;Пока событий нет...&lt;/p&gt;
                ) : (
                  warEvents.map((event) =&gt; (
                    &lt;div key={event.id} className="text-xs bg-slate-600 p-2 rounded"&gt;
                      &lt;span className="text-red-400"&gt;⚔️ {event.attacker}&lt;/span&gt; vs &lt;span className="text-blue-400"&gt;{event.defender}&lt;/span&gt;
                      &lt;div className="text-slate-400 mt-1"&gt;{event.result}&lt;/div&gt;
                    &lt;/div&gt;
                  ))
                )}
              &lt;/div&gt;
            &lt;/CardContent&gt;
          &lt;/Card&gt;
        &lt;/div&gt;

        {/* Основная карта */}
        &lt;div className="flex-1 relative overflow-hidden"&gt;
          &lt;div 
            ref={mapRef}
            className="w-full h-full cursor-crosshair bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden"
            onClick={handleMapClick}
            style={{ width: '1200px', height: '600px' }}
          &gt;
            {/* Территории */}
            {territories.map((territory) =&gt; {
              const country = countries.find(c =&gt; c.id === territory.countryId);
              return (
                &lt;div
                  key={territory.id}
                  className={`absolute border border-slate-600 transition-all duration-300 hover:border-white ${
                    country ? 'hover:brightness-110' : 'hover:bg-slate-700'
                  }`}
                  style={{
                    left: territory.x,
                    top: territory.y,
                    width: territory.width,
                    height: territory.height,
                    backgroundColor: country ? country.color : 'rgba(71, 85, 105, 0.3)'
                  }}
                  onClick={(e) =&gt; {
                    e.stopPropagation();
                    if (country) {
                      setSelectedCountry(country);
                    }
                  }}
                /&gt;
              );
            })}

            {/* Столицы и города */}
            {countries.map((country) =&gt; (
              &lt;div key={`cities-${country.id}`}&gt;
                {/* Столица */}
                &lt;div
                  className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse z-10"
                  style={{
                    left: country.capital.x - 6,
                    top: country.capital.y - 6
                  }}
                  title={`Столица ${country.name}`}
                /&gt;
                
                {/* Города */}
                {country.cities.map((city, idx) =&gt; (
                  &lt;div
                    key={`city-${country.id}-${idx}`}
                    className="absolute w-2 h-2 bg-white rounded-full border border-slate-300 z-10"
                    style={{
                      left: city.x - 4,
                      top: city.y - 4
                    }}
                    title={`Город ${country.name}`}
                  /&gt;
                ))}
              &lt;/div&gt;
            ))}

            {/* Инструкция */}
            {countries.length === 0 && (
              &lt;div className="absolute inset-0 flex items-center justify-center"&gt;
                &lt;div className="text-center bg-slate-800 bg-opacity-90 p-8 rounded-lg border border-slate-600"&gt;
                  &lt;Icon name="MousePointer" size={48} className="mx-auto mb-4 text-blue-400" /&gt;
                  &lt;h2 className="text-2xl font-bold mb-2 text-white"&gt;Добро пожаловать в World Simulator!&lt;/h2&gt;
                  &lt;p className="text-slate-300 mb-4"&gt;Кликните на любое место карты, чтобы создать первую страну&lt;/p&gt;
                  &lt;Badge variant="outline" className="text-blue-400 border-blue-400"&gt;
                    Начните свою цивилизацию прямо сейчас!
                  &lt;/Badge&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            )}
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
};

export default Index;