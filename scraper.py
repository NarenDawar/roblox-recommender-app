import requests
from bs4 import BeautifulSoup
import json
import time
import random
from urllib.parse import urljoin, quote
import csv
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class RobloxGame:
    name: str
    description: str
    genre: str
    sub_genre: str
    url: str
    creator: str
    players: str
    likes: str
    dislikes: str

class RobloxScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.base_url = "https://www.roblox.com"
        
    def get_games_from_category(self, category: str = "popular", max_games: int = 50) -> List[RobloxGame]:
        """
        Scrape games from a specific category
        Categories: popular, top-rated, featured, etc.
        """
        games = []
        
        # Roblox games URL
        games_url = f"{self.base_url}/games"
        
        try:
            response = self.session.get(games_url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find game cards (these selectors may need updating based on Roblox's current structure)
            game_cards = soup.find_all('div', class_='game-card')
            
            for card in game_cards[:max_games]:
                try:
                    game = self._extract_game_info(card)
                    if game:
                        games.append(game)
                        print(f"Scraped: {game.name}")
                        
                    # Be respectful with requests
                    time.sleep(random.uniform(1, 3))
                    
                except Exception as e:
                    print(f"Error extracting game info: {e}")
                    continue
                    
        except requests.RequestException as e:
            print(f"Error fetching games page: {e}")
            
        return games
    
    def _extract_game_info(self, card) -> Optional[RobloxGame]:
        """Extract game information from a game card"""
        try:
            # Extract game name
            name_elem = card.find('span', class_='game-name')
            name = name_elem.get_text(strip=True) if name_elem else "Unknown"
            
            # Extract game URL
            link_elem = card.find('a')
            game_url = urljoin(self.base_url, link_elem['href']) if link_elem else ""
            
            # Get detailed info from game page
            detailed_info = self._get_game_details(game_url) if game_url else {}
            
            return RobloxGame(
                name=name,
                description=detailed_info.get('description', ''),
                genre=detailed_info.get('genre', ''),
                sub_genre=detailed_info.get('sub_genre', ''),
                url=game_url,
                creator=detailed_info.get('creator', ''),
                players=detailed_info.get('players', ''),
                likes=detailed_info.get('likes', ''),
                dislikes=detailed_info.get('dislikes', '')
            )
            
        except Exception as e:
            print(f"Error in _extract_game_info: {e}")
            return None
    
    def _get_game_details(self, game_url: str) -> dict:
        """Get detailed information from individual game page"""
        try:
            response = self.session.get(game_url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            details = {}
            
            # Extract description
            desc_elem = soup.find('pre', class_='game-description')
            if not desc_elem:
                desc_elem = soup.find('div', class_='game-description')
            details['description'] = desc_elem.get_text(strip=True) if desc_elem else ''
            
            # Extract genre information
            genre_elem = soup.find('span', class_='genre')
            details['genre'] = genre_elem.get_text(strip=True) if genre_elem else ''
            
            # Extract sub-genre (if available)
            sub_genre_elem = soup.find('span', class_='sub-genre')
            details['sub_genre'] = sub_genre_elem.get_text(strip=True) if sub_genre_elem else ''
            
            # Extract creator
            creator_elem = soup.find('span', class_='creator-name')
            if not creator_elem:
                creator_elem = soup.find('a', class_='creator-name')
            details['creator'] = creator_elem.get_text(strip=True) if creator_elem else ''
            
            # Extract player count
            players_elem = soup.find('span', class_='playing-count')
            details['players'] = players_elem.get_text(strip=True) if players_elem else ''
            
            # Extract likes/dislikes
            likes_elem = soup.find('span', class_='like-count')
            details['likes'] = likes_elem.get_text(strip=True) if likes_elem else ''
            
            dislikes_elem = soup.find('span', class_='dislike-count')
            details['dislikes'] = dislikes_elem.get_text(strip=True) if dislikes_elem else ''
            
            return details
            
        except Exception as e:
            print(f"Error getting game details: {e}")
            return {}
    
    def search_games(self, query: str, max_results: int = 20) -> List[RobloxGame]:
        """Search for games by keyword"""
        games = []
        
        search_url = f"{self.base_url}/search/games"
        params = {'keyword': query}
        
        try:
            response = self.session.get(search_url, params=params)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find search result items
            result_items = soup.find_all('div', class_='search-result')
            
            for item in result_items[:max_results]:
                try:
                    game = self._extract_game_info(item)
                    if game:
                        games.append(game)
                        print(f"Found: {game.name}")
                        
                    time.sleep(random.uniform(1, 2))
                    
                except Exception as e:
                    print(f"Error processing search result: {e}")
                    continue
                    
        except requests.RequestException as e:
            print(f"Error searching games: {e}")
            
        return games
    
    def save_to_csv(self, games: List[RobloxGame], filename: str = "roblox_games.csv"):
        """Save scraped games to CSV file"""
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['name', 'description', 'genre', 'sub_genre', 'url', 'creator', 'players', 'likes', 'dislikes']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for game in games:
                writer.writerow({
                    'name': game.name,
                    'description': game.description,
                    'genre': game.genre,
                    'sub_genre': game.sub_genre,
                    'url': game.url,
                    'creator': game.creator,
                    'players': game.players,
                    'likes': game.likes,
                    'dislikes': game.dislikes
                })
        
        print(f"Saved {len(games)} games to {filename}")
    
    def save_to_json(self, games: List[RobloxGame], filename: str = "roblox_games.json"):
        """Save scraped games to JSON file"""
        games_data = []
        for game in games:
            games_data.append({
                'name': game.name,
                'description': game.description,
                'genre': game.genre,
                'sub_genre': game.sub_genre,
                'url': game.url,
                'creator': game.creator,
                'players': game.players,
                'likes': game.likes,
                'dislikes': game.dislikes
            })
        
        with open(filename, 'w', encoding='utf-8') as jsonfile:
            json.dump(games_data, jsonfile, indent=2, ensure_ascii=False)
        
        print(f"Saved {len(games)} games to {filename}")

def main():
    """Example usage"""
    scraper = RobloxScraper()
    
    print("Starting Roblox game scraper...")
    
    # Scrape popular games
    print("\n1. Scraping popular games...")
    popular_games = scraper.get_games_from_category("popular", max_games=10)
    
    # Search for specific games
    print("\n2. Searching for 'adventure' games...")
    adventure_games = scraper.search_games("adventure", max_results=5)
    
    # Combine results
    all_games = popular_games + adventure_games
    
    print(f"\nTotal games scraped: {len(all_games)}")
    
    # Save results
    if all_games:
        scraper.save_to_csv(all_games)
        scraper.save_to_json(all_games)
        
        # Print summary
        print("\nSample of scraped games:")
        for i, game in enumerate(all_games[:3]):
            print(f"\n{i+1}. {game.name}")
            print(f"   Genre: {game.genre}")
            print(f"   Creator: {game.creator}")
            print(f"   Description: {game.description[:100]}...")
    
    print("\nScraping completed!")

if __name__ == "__main__":
    main()