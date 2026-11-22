<?php

class h67b_control
{
    public function Greet($name)
    {
        if($name == '') { return 'x'; } else { return "hi ".$name; }
    }
}
