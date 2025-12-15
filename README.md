# Shorten URL API Service

## Requirements
- Node v20
- Mysql
- Redis
- API Tester (Postman Recommended)

## How to use
### Manual Installation
- Create a mysql database.
- Duplicate .env.example to .env `cp .env.example .env`
- Configure the `.env` variables suit with your system.
- Install the required node packages `npm i`
- Migrate the data `npm run migrate`
- Seed the data `npm run dbseed`
- After all configs done, you can serve the service using `npm run dev`
- Import postman collection in doc folder inside this repo
- Config your postman environment
- Don't forget to check Health API, and Login before testing
- Happy Testing

### Create Migration
- Run : npx typeorm migration:create ./src/database/migrations/NewMigration

### Containerized Installation using Docker
- Clone repository from `https://github.com/achmadzainulkarim/shortly`
- Duplicate .env.example to .env `cp .env.example .env`
- Configure the `.env` variables suit with your system.
- Build docker `docker-compose up --build`
- Run migration `docker-compose exec app npm run migrate`
- Seed the data `docker-compose exec app npm run dbseed`
- Rerun containers `docker-compose up -d`
- Import postman collection in doc folder inside this repo
- Config your postman environment
- Don't forget to check Health API, and Login before testing
- Happy Coding



<!-- Fix Category -->
running - pnpm seed:category

📦 GET Merchandise Categories
GET /public/merchandise/category

http://localhost:3000/api/public/merchandise/category



📦 GET Featured Merchandise Products
GET /api/public/merchandise/featured

http://localhost:3000/api/public/merchandise/featured?page=1&limit=10&sort_by=price&sort_dir=desc

🧾 Query Parameters
Parameter	    Tipe	    Default 	Deskripsi
page	        number	    1	        Halaman yang ingin ditampilkan
limit	        number	    10	        Jumlah item per halaman
sort_by	        string	    name	    Urutan kolom, hanya name atau price yang diperbolehkan
sort_dir	    string	    ASC	        Arah pengurutan: asc atau desc
search	        string	    -	        (Opsional) Cari berdasarkan nama produk
category_id	    string	    -	        (Opsional) Filter berdasarkan ID kategori merchandise




📥 GET /public/merchandise/cart/:player_uuid
Mengambil isi cart untuk pemain tertentu.

🔗 Endpoint
http://localhost:3000/api/public/merchandise/cart/3eb21cc9-2cc5-4063-82a0-5a917f01fa67

🔧 Parameters
Param	        Type	    Description
player_uuid	    string	    UUID pemain 

✅ Contoh Response
[
	{
		"product_detail_uuid": "7ac11fa5-c588-4e7f-a1fb-91e66b6cbdd2",
		"quantity": 2,
		"productDetail": {
			"uuid": "7ac11fa5-c588-4e7f-a1fb-91e66b6cbdd2",
			"size": "S",
			"price": 100000,
			"product": {
				"name": "Seventy Five Classic T-Shirt",
				"media_url": "https://www.youtube.com/watch?v=Y4j34_DDbyY",
				"category": {
					"name": "Stiker"
				}
			}
		}
	},
	{
		"product_detail_uuid": "ecbed58a-b407-40c4-82b1-d754fd782016",
		"quantity": 6,
		"productDetail": {
			"uuid": "ecbed58a-b407-40c4-82b1-d754fd782016",
			"size": "M",
			"price": 34534,
			"product": {
				"name": "Baju Haram But 75",
				"media_url": null
			}
		}
	}
]




🛠 PUT /public/merchandise/cart/:player_uuid
Menambahkan atau memperbarui item di cart untuk pemain tertentu. Bisa mengirim satu atau beberapa item sekaligus.

🔗 Endpoint
http://localhost:3000/api/public/merchandise/cart/3eb21cc9-2cc5-4063-82a0-5a917f01fa67

📦 Body (application/json)
Array dari item yang ingin ditambahkan atau diperbarui.
[
  {
    "product_detail_uuid": "7ac11fa5-c588-4e7f-a1fb-91e66b6cbdd2",
    "quantity": 2
  },
  {
    "product_detail_uuid": "ecbed58a-b407-40c4-82b1-d754fd782016",
    "quantity": 6
  }
]

🔧 Parameters
Param	        Type	    Description
player_uuid	    string	    UUID pemain yang memiliki cart

✅ Contoh Response
{
	"message": "Cart updated",
	"cart": [
		{
			"product_detail_uuid": "7ac11fa5-c588-4e7f-a1fb-91e66b6cbdd2",
			"quantity": 2,
			"productDetail": {
				"uuid": "7ac11fa5-c588-4e7f-a1fb-91e66b6cbdd2",
				"size": "S",
				"price": 100000,
				"product": {
					"name": "Seventy Five Classic T-Shirt",
					"media_url": "https://www.youtube.com/watch?v=Y4j34_DDbyY",
					"category": {
						"name": "Stiker"
					}
				}
			}
		},
		{
			"product_detail_uuid": "ecbed58a-b407-40c4-82b1-d754fd782016",
			"quantity": 6,
			"productDetail": {
				"uuid": "ecbed58a-b407-40c4-82b1-d754fd782016",
				"size": "M",
				"price": 34534,
				"product": {
					"name": "Baju Haram But 75",
					"media_url": null
				}
			}
		}
	]
}







🧾 API: Checkout Merchandise Cart
 POST /api/public/merchandise/checkout

📥 Request Body
{
	"player_uuid": "3eb21cc9-2cc5-4063-82a0-5a917f01fa67",
  "name": "Wahyu Fatoni",
  "email": "wahyu@example.com",
  "phone": "08123456789",
  "address": "Jl. Kebebasan No. 75",
  "city": "Jakarta",
  "cart": [
		{
			"product_detail_uuid": "7ac11fa5-c588-4e7f-a1fb-91e66b6cbdd2",
			"quantity": 2,
			"productDetail": {
				"uuid": "7ac11fa5-c588-4e7f-a1fb-91e66b6cbdd2",
				"size": "S",
				"price": 100000,
				"product": {
					"name": "Seventy Five Classic T-Shirt",
					"media_url": "https://www.youtube.com/watch?v=Y4j34_DDbyY",
					"category": {
						"name": "Stiker"
					}
				}
			}
		},
		{
			"product_detail_uuid": "ecbed58a-b407-40c4-82b1-d754fd782016",
			"quantity": 4,
			"productDetail": {
				"uuid": "ecbed58a-b407-40c4-82b1-d754fd782016",
				"size": "M",
				"price": 34534,
				"product": {
					"name": "Baju Haram But 75",
					"media_url": null
				}
			}
		}
	]
}

📤 Response: ✅ Sukses
{
	"message": "Checkout successful",
	"order_uuid": "de00cc6f-24b1-4883-bbd4-1a97a60ce4cb"
}

⚠️ Response: ❌ Gagal karena mismatch harga
{
	"message": "Cart contains outdated prices. Cart has been refreshed.",
	"cart": [
		{
			"product_detail_uuid": "7ac11fa5-c588-4e7f-a1fb-91e66b6cbdd2",
			"quantity": 2,
			"productDetail": {
				"uuid": "7ac11fa5-c588-4e7f-a1fb-91e66b6cbdd2",
				"size": "S",
				"price": 100000,
				"product": {
					"name": "Seventy Five Classic T-Shirt",
					"media_url": "https://www.youtube.com/watch?v=Y4j34_DDbyY",
					"category": {
						"name": "Stiker"
					}
				}
			}
		},
		{
			"product_detail_uuid": "ecbed58a-b407-40c4-82b1-d754fd782016",
			"quantity": 4,
			"productDetail": {
				"uuid": "ecbed58a-b407-40c4-82b1-d754fd782016",
				"size": "M",
				"price": 34534,
				"product": {
					"name": "Baju Haram But 75",
					"media_url": null
				}
			}
		}
	]
}

🔒 Validasi
Field	                        Tipe	Required    	  Keterangan
player_uuid	                    string	✅	            UUID pemain
name	                        string	✅	            Nama pemesan
email	                        string	❌	            Email pemesan (opsional)
phone	                        string	✅	            Nomor telepon
address	                        string	✅	            Alamat lengkap
city	                        string	✅	            Kota
cart	                        array	✅	            Isi keranjang belanja
cart[].product_detail_uuid	    string	✅	            UUID dari detail produk
cart[].quantity	                number	✅	            Jumlah item
cart[].productDetail.price	    number	✅	            Harga terakhir yang ditampilkan ke user

🗃️ Proses yang Terjadi Saat Checkout
Validasi seluruh isi cart

1. Ambil harga real-time dari database untuk product_detail_uuid

2. Jika ada mismatch harga:

    * Update cart di Redis

    * Return error

3. Jika semua valid:

    * Simpan order ke tabel merch_orders

    * Simpan item ke merch_order_items

    * Simpan histori awal ORDERED ke merch_order_history

    * Hapus cart dari Redis

