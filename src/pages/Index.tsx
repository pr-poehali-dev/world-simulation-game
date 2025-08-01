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
  { name: '1x', description: '1 день/сек', multiplier: 1 },
  { name: '10x', description: '10 дней/сек', multiplier: 10 },
  { name: '365x', description: '1 год/сек', multiplier: 365 },
  { name: '3650x', description: '10 лет/сек', multiplier: 3650 },
  { name: '36500x', description: '100 лет/сек', multiplier: 36500 }
];

const COUNTRY_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'];

const Index = () => {
  const [countries, setCountries] = useState&lt;Country[]&gt;([]);
  const [territories, setTerritories] = useState&lt;Territory[]&gt;([]);
  const [worldStats, setWorldStats] = useState&lt;WorldStats&gt;({
    totalPopulation: 0,
    totalEconomy: 0,
    totalMilitary: 0,
    date: { year: 0, month: 1, day: 1 }
  });
  const [selectedCountry, setSelectedCountry] = useState&lt;Country | null&gt;(null);
  const [warEvents, setWarEvents] = useState&lt;WarEvent[]&gt;([]);
  const [speedMode, setSpeedMode] = useState(0);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const mapRef = useRef&lt;HTMLDivElement&gt;(null);
  const intervalRef = useRef&lt;NodeJS.Timeout | null&gt;(null);

  // Инициализация территорий карты мира
  useEffect(() =&gt; {
    const initTerritories = () =&gt; {
      const newTerritories: Territory[] = [];
      // Создаем сетку территорий (упрощенная карта мира)
      const rows = 20;
      const cols = 40;
      const territoryWidth = 800 / cols;
      const territoryHeight = 400 / rows;

      for (let i = 0; i &lt; rows; i++) {
        for (let j = 0; j &lt; cols; j++) {
          // Пропускаем некоторые территории для создания "океанов"
          if (Math.random() &gt; 0.25) {
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
      const newCountry: Country = {
        id: `country-${Date.now()}`,
        name: `Страна ${countries.length + 1}`,
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
        diplomacy: { allies: [], enemies: [] }
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
    if (isSimulationRunning && countries.length &gt; 0) {
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

          return {
            ...country,
            population: country.population + populationGrowth,
            economy: country.economy + economyGrowth,
            military: country.military + militaryGrowth,
            weapons: country.weapons.map(weapon =&gt; ({
              ...weapon,
              count: weapon.count + Math.floor(weapon.count * 0.001 * speed)
            }))
          };
        }));

        // Случайные события войны
        if (Math.random() &lt; 0.1 && prev.length &gt; 1) {
          const attacker = prev[Math.floor(Math.random() * prev.length)];
          const defender = prev[Math.floor(Math.random() * prev.length)];
          
          if (attacker.id !== defender.id) {
            const warEvent: WarEvent = {
              id: `war-${Date.now()}`,
              attacker: attacker.name,
              defender: defender.name,
              result: Math.random() &gt; 0.5 ? 'победа' : 'поражение',
              date: new Date().toLocaleString('ru-RU')
            };
            
            setWarEvents(prev =&gt; [warEvent, ...prev.slice(0, 9)]);
          }
        }
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
              &lt;div className="grid grid-cols-5 gap-1"&gt;
                {SPEED_MODES.map((mode, index) =&gt; (
                  &lt;Button
                    key={index}
                    onClick={() =&gt; setSpeedMode(index)}
                    variant={speedMode === index ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
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
                  &lt;h4 className="text-sm font-semibold text-white mb-2"&gt;Вооружение:&lt;/h4&gt;
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
            className="w-full h-full cursor-crosshair bg-gradient-to-br from-blue-900 to-blue-700 relative"
            onClick={handleMapClick}
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