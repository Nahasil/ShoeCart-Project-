
function addToCart(proId)
{
  $.ajax({
    url:'/add-to-cart/'+proId,
    method:'get',
    success:(response)=>{
     if(response.status){
        let count=$('#cart-count').html()
        count=parseInt(count)+1
        $('#cart-count').html(count)
     }  
     
    }
  })
}

function search_product() {
  let input = document.getElementById('searchbar').value
  input = input.toLowerCase();
  let x = document.getElementsByClassName('brand');
  let d = document.getElementsByClassName('hide-div')
  for (i = 0; i < x.length; i++) {
      if (!x[i].innerHTML.toLowerCase().includes(input)) {
          x[i].style.display = "none";
          d[i].style.display = "none";
      }
      else {
          x[i].style.display = "list-item";
          d[i].style.display = "block";
      }
  }
}








//coupon
function applycoupon() {

  let code = document.getElementById('couponid').value
  // console.log(code)
  $.ajax({
      url: '/place-order/applycoupon',
      data: { code },
      method: 'post',
      success: (response) => {
          console.log(response);
          if (response.couponPrice) {
              newcoupon = code
              // location.reload()
              document.getElementById('couponul').innerHTML += ` <li><span>Discount Price</span><span id=""> ₹ ${response.couponPrice}</span>`
              document.getElementById('applybtn').disabled = true
              // alert(response.disPrice)
              document.getElementById('couponsuccess').innerHTML = response.message
              document.getElementById('couponinvalid').innerHTML = " "

          } else if (response.vmessage == true) {
              document.getElementById('couponinvalid').innerHTML = " "
              document.getElementById('couponinval').innerHTML = response.message

          } else if (response.imessage == true) {
              document.getElementById('couponinval').innerHTML = " "
              document.getElementById('couponinvalid').innerHTML = response.invalidmessage

          } else if (response.umessage == true) {
              console.log("kerii");
              document.getElementById('couponinvalid').innerHTML = response.uerrmessage
          }

      }
  })
}
